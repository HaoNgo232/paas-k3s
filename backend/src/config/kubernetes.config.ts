import { registerAs } from '@nestjs/config';

export default registerAs('kubernetes', () => ({
  kubeconfig: process.env.KUBECONFIG,
}));
