import { io } from 'socket.io-client';

const URL = import.meta.env.PROD
  ? 'https://api-27op.onrender.com'
  : 'http://localhost:3000';

export const socket = io(URL, {
  autoConnect: false,
});
