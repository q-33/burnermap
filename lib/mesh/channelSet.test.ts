import { describe, expect, it } from 'vitest'
import { ONPLAYA_CHANNEL, ONPLAYA_LORA } from './onplayaChannel'
import { buildChannelUrl, randomPsk } from './channelSet'

describe('buildChannelUrl', () => {
  // The hand-rolled encoder must exactly match the real Meshtastic protobuf
  // encoder — this is what makes it safe to ship without the SDK at runtime.
  it('matches the Meshtastic SDK encoder byte-for-byte', async () => {
    const data = buildChannelUrl(ONPLAYA_CHANNEL).split('#')[1]!

    const { create, toBinary } = await import('@bufbuild/protobuf')
    const { Protobuf } = await import('@meshtastic/core')
    const ref = create(Protobuf.AppOnly.ChannelSetSchema, {
      settings: [create(Protobuf.Channel.ChannelSettingsSchema, { name: ONPLAYA_CHANNEL.name, psk: ONPLAYA_CHANNEL.psk })],
      loraConfig: create(Protobuf.Config.Config_LoRaConfigSchema, {
        usePreset: true,
        modemPreset: ONPLAYA_LORA.modemPreset,
        region: ONPLAYA_LORA.region,
        hopLimit: ONPLAYA_LORA.hopLimit,
        txEnabled: true,
        channelNum: ONPLAYA_LORA.channelNum,
        ignoreMqtt: ONPLAYA_LORA.ignoreMqtt,
      }),
    })
    const refB64 = Buffer.from(toBinary(Protobuf.AppOnly.ChannelSetSchema, ref)).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(data).toBe(refB64)
  })

  it('produces a valid, round-trippable Meshtastic URL', async () => {
    const url = buildChannelUrl(ONPLAYA_CHANNEL)
    expect(url.startsWith('https://meshtastic.org/e/#')).toBe(true)

    const data = url.split('#')[1]!
    const { fromBinary } = await import('@bufbuild/protobuf')
    const { Protobuf } = await import('@meshtastic/core')
    const pad = data + '='.repeat((4 - (data.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(pad.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const cs = fromBinary(Protobuf.AppOnly.ChannelSetSchema, bytes)

    expect(cs.settings[0]!.name).toBe('OnPlaya')
    expect(cs.settings[0]!.psk.length).toBe(32)
    expect(cs.loraConfig?.region).toBe(1)
    expect(cs.loraConfig?.hopLimit).toBe(3)
    expect(cs.loraConfig?.ignoreMqtt).toBe(true)
  })

  it('gives distinct URLs for distinct PSKs (crew channels)', () => {
    expect(buildChannelUrl({ name: 'Crew', psk: randomPsk() })).not.toBe(buildChannelUrl({ name: 'Crew', psk: randomPsk() }))
  })
})
