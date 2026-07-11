import { describe, expect, it } from 'vitest'
import { BURNERMAP_CHANNEL } from './burnermapChannel'
import { buildChannelUrl, randomPsk } from './channelSet'

describe('buildChannelUrl', () => {
  it('produces a valid Meshtastic channel-set URL that round-trips', async () => {
    const url = await buildChannelUrl(BURNERMAP_CHANNEL)
    expect(url.startsWith('https://meshtastic.org/e/#')).toBe(true)

    const data = url.split('#')[1]!
    const { fromBinary } = await import('@bufbuild/protobuf')
    const { Protobuf } = await import('@meshtastic/core')
    const pad = data + '='.repeat((4 - (data.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(pad.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const cs = fromBinary(Protobuf.AppOnly.ChannelSetSchema, bytes)

    expect(cs.settings[0]!.name).toBe('BurnerMap')
    expect(cs.settings[0]!.psk.length).toBe(32)
    expect(cs.loraConfig?.region).toBe(Protobuf.Config.Config_LoRaConfig_RegionCode.US)
    expect(cs.loraConfig?.modemPreset).toBe(Protobuf.Config.Config_LoRaConfig_ModemPreset.LONG_FAST)
    expect(cs.loraConfig?.hopLimit).toBe(3)
    expect(cs.loraConfig?.ignoreMqtt).toBe(true)
  })

  it('gives distinct URLs for distinct PSKs (crew channels)', async () => {
    const a = await buildChannelUrl({ name: 'Crew', psk: randomPsk() })
    const b = await buildChannelUrl({ name: 'Crew', psk: randomPsk() })
    expect(a).not.toBe(b)
  })
})
