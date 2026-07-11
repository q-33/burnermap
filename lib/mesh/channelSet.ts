import { BURNERMAP_LORA } from './burnermapChannel'

export interface MeshChannel { name: string, psk: Uint8Array }

// Build a Meshtastic channel-set share URL (https://meshtastic.org/e/#…) for the
// given PRIMARY channel + the BurnerMap LoRa preset. Scanning it in the Meshtastic
// app (or applying it to a connected radio) puts a stock device on the mesh.
//
// Async + dynamic import: the Meshtastic SDK (GPL, browser-oriented) stays out of
// SSR and the main bundle; this only runs when the user opens the setup UI.
export async function buildChannelUrl(channel: MeshChannel): Promise<string> {
  const [{ create, toBinary }, { Protobuf }] = await Promise.all([
    import('@bufbuild/protobuf'),
    import('@meshtastic/core'),
  ])
  const { ChannelSetSchema } = Protobuf.AppOnly
  const { ChannelSettingsSchema } = Protobuf.Channel
  const { Config_LoRaConfigSchema, Config_LoRaConfig_ModemPreset, Config_LoRaConfig_RegionCode } = Protobuf.Config

  const channelSet = create(ChannelSetSchema, {
    settings: [create(ChannelSettingsSchema, { name: channel.name, psk: channel.psk })],
    loraConfig: create(Config_LoRaConfigSchema, {
      usePreset: true,
      modemPreset: (Config_LoRaConfig_ModemPreset as Record<string, number>)[BURNERMAP_LORA.preset],
      region: (Config_LoRaConfig_RegionCode as Record<string, number>)[BURNERMAP_LORA.region],
      channelNum: BURNERMAP_LORA.channelNum,
      hopLimit: BURNERMAP_LORA.hopLimit,
      ignoreMqtt: BURNERMAP_LORA.ignoreMqtt,
      txEnabled: true,
    }),
  })
  return `https://meshtastic.org/e/#${base64url(toBinary(ChannelSetSchema, channelSet))}`
}

// URL-safe base64 with no padding, per Meshtastic's channel-URL format.
function base64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes)
    bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// A fresh 32-byte AES256 key for a private crew channel.
export function randomPsk(): Uint8Array {
  const psk = new Uint8Array(32)
  crypto.getRandomValues(psk)
  return psk
}
