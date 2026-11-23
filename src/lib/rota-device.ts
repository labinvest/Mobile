import { PermissionsAndroid, Platform } from 'react-native';
import type { BleManager } from 'react-native-ble-plx';

// Mesmos UUIDs de Firmware/rota-gps/rota-gps.ino.
const SERVICE = '7a1f0001-5b6e-4c1a-9d2e-3f4a5b6c7d8e';
const COMMAND = '7a1f0002-5b6e-4c1a-9d2e-3f4a5b6c7d8e';
const STATUS = '7a1f0003-5b6e-4c1a-9d2e-3f4a5b6c7d8e';

/** Tempo juntando dispositivos Rota antes de escolher o mais próximo (maior sinal). */
const SCAN_MS = 3000;
/** Sem nenhum dispositivo nesse tempo, desiste. */
const NOT_FOUND_MS = 15000;
const RESPONSE_TIMEOUT_MS = 5000;
/** Igual ao BLEDevice::setMTU do firmware; o padrão (23) cortaria o status. */
const MTU = 185;

export type Role = 'student' | 'teacher';

export type CarStatus = {
  student: boolean;
  teacher: boolean;
  recording: boolean;
  points: number;
  pending: boolean;
  gps: boolean;
  /** Final do último desafio que o carro respondeu, para o app saber que a resposta é a dele. */
  challengeTag: string;
  /** Resposta do carro ao último desafio; null enquanto não houve nenhum. */
  response: string | null;
  /** Aula que o carro está gravando ou entregando; 0 = nenhuma. */
  lessonId: number;
};

export type CarConnection = {
  send: (command: string) => Promise<void>;
  /** Leva o desafio da API ao carro e devolve a resposta dele (a API confere). */
  respond: (challenge: string) => Promise<string>;
  close: () => Promise<void>;
};

/** "student=1,teacher=0,rec=0,pts=12,pending=0,gps=1,rc=abcd1234,resp=0123456789abcdef" */
export function parseStatus(text: string): CarStatus {
  const fields = Object.fromEntries(text.split(',').map((pair) => pair.split('=') as [string, string]));
  return {
    student: fields.student === '1',
    teacher: fields.teacher === '1',
    recording: fields.rec === '1',
    points: Number(fields.pts) || 0,
    pending: fields.pending === '1',
    gps: fields.gps === '1',
    challengeTag: fields.rc ?? '',
    response: /^[0-9a-f]{16}$/.test(fields.resp ?? '') ? fields.resp : null,
    lessonId: Number(fields.lesson) || 0,
  };
}

async function requestPermissions() {
  if (Platform.OS !== 'android') return;
  const needed = Number(Platform.Version) >= 31
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(needed);
  if (needed.some((permission) => result[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
    throw new Error('Permita o Bluetooth nas configurações do celular para conectar ao carro.');
  }
}

let manager: BleManager | null = null;

async function getManager() {
  // Importado só aqui para a versão web (sem Bluetooth) não carregar o módulo nativo.
  const { BleManager } = await import('react-native-ble-plx');
  return (manager ??= new BleManager());
}

/** Escaneia e devolve o id do dispositivo Rota com o sinal mais forte, que é o do carro em que você está. */
async function findNearestCar(ble: BleManager) {
  return new Promise<string>((resolve, reject) => {
    const seen = new Map<string, number>();
    const finish = () => {
      ble.stopDeviceScan();
      const nearest = [...seen.entries()].sort((a, b) => b[1] - a[1])[0];
      if (nearest) resolve(nearest[0]);
      else reject(new Error('Não encontrei o dispositivo do carro. Confira se ele está ligado e perto de você.'));
    };
    let timer = setTimeout(finish, NOT_FOUND_MS);
    ble.startDeviceScan([SERVICE], null, (error, device) => {
      if (error) {
        clearTimeout(timer);
        ble.stopDeviceScan();
        reject(new Error('Ligue o Bluetooth do celular para conectar ao carro.'));
        return;
      }
      if (!device) return;
      // Ao achar o primeiro, ainda espera um pouco para outros carros aparecerem.
      if (seen.size === 0) { clearTimeout(timer); timer = setTimeout(finish, SCAN_MS); }
      seen.set(device.id, Math.max(seen.get(device.id) ?? -Infinity, device.rssi ?? -Infinity));
    });
  });
}

/** Procura o carro mais próximo, conecta e se apresenta ("HI student" / "HI teacher"). */
export async function connectToCar(role: Role, onStatus: (status: CarStatus) => void, onLost: () => void): Promise<CarConnection> {
  if (Platform.OS === 'web') throw new Error('O Bluetooth não está disponível na versão web.');
  await requestPermissions();
  const ble = await getManager();

  const device = await (await ble.connectToDevice(await findNearestCar(ble), { requestMTU: MTU })).discoverAllServicesAndCharacteristics();
  device.onDisconnected(onLost);

  const waiters = new Set<(status: CarStatus) => void>();
  device.monitorCharacteristicForService(SERVICE, STATUS, (error, characteristic) => {
    if (error || !characteristic?.value) return;
    const status = parseStatus(atob(characteristic.value));
    onStatus(status);
    waiters.forEach((waiter) => waiter(status));
  });

  const send = async (command: string) => {
    await device.writeCharacteristicWithResponseForService(SERVICE, COMMAND, btoa(command));
  };

  const respond = (challenge: string) => new Promise<string>((resolve, reject) => {
    const waiter = (status: CarStatus) => {
      if (status.response && status.challengeTag === challenge.slice(-8)) { clearTimeout(timer); waiters.delete(waiter); resolve(status.response); }
    };
    const timer = setTimeout(() => { waiters.delete(waiter); reject(new Error('O dispositivo do carro não respondeu. Tente de novo.')); }, RESPONSE_TIMEOUT_MS);
    waiters.add(waiter);
    send(`CHAL ${challenge}`).catch((error) => { clearTimeout(timer); waiters.delete(waiter); reject(error); });
  });

  await send(`HI ${role}`);
  return { send, respond, close: async () => { await device.cancelConnection().catch(() => undefined); } };
}
