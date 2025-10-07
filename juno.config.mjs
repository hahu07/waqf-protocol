import { defineConfig } from "@junobuild/config";

/** @type {import('@junobuild/config').JunoConfig} */
export default defineConfig({
  satellite: {
    ids: {
      development: process.env.NEXT_PUBLIC_JUNO_SATELLITE_ID,
      production: "<PROD_SATELLITE_ID>",
    },
    source: "out",
    predeploy: ["npm run build"],
  },
   emulator: {
    runner: {
      type: "docker",
      image: "junobuild/skylab:latest",
      name: "juno-skylab",
      volume: "juno",
      platform: "linux/amd64"
    },
    skylab: {
     }
  }
});
