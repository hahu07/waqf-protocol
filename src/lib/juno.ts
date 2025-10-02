import { initSatellite } from '@junobuild/core';

export const initJuno = async () => {
  await initSatellite({
    satelliteId: process.env.NEXT_PUBLIC_SATELLITE_ID,
    workers: { auth: true }
  });
};
