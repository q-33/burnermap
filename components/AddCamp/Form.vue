<script setup lang="ts">
import { useMutation, useQueryClient } from 'vue-query'
import { CAMP_ADDRESS_OPTIONS, CENTER_CAMP_ADDRESS_OPTIONS } from '~/constants/index'
import { useCamps } from '~/composables/api/useCamps'
import { useAuthStore } from '~/stores/auth'
import { useBrcGeocode } from '~/composables/useBrcGeocode'

const { campList = [] } = defineProps<{
  campList?: Array<any>
}>()

const authStore = useAuthStore()
const { addLocationByCampId } = useCamps()
const { geocodeAddress } = useBrcGeocode()
const queryClient = useQueryClient()

const isLoggedIn = computed(() => !!authStore.user?.id)
const submitted = ref(false)

function useCreateCamp() {
  return useMutation(
    (sub: any) => addLocationByCampId(sub.id, {
      string: sub.address,
      gps_latitude: sub.gps_latitude,
      gps_longitude: sub.gps_longitude,
    }),
    {
      onSuccess: () => {
        submitted.value = true
        // refresh the map/list so the new location shows up
        queryClient.invalidateQueries(['allCamps'])
      },
    },
  )
}

const { isLoading, isError, error, isSuccess, mutate } = useCreateCamp()

const campForm = ref({
  id: '',
  address: '',
  addressType: '',
})

function addCampLocation() {
  const gps = geocodeAddress(campForm.value.address)
  mutate({
    id: campForm.value.id,
    address: campForm.value.address,
    gps_latitude: gps?.gps_latitude ?? null,
    gps_longitude: gps?.gps_longitude ?? null,
  })
}

// sortCampList sorts the camplist array by name
function sortCampList(list: any[]) {
  return list.sort((a: any, b: any) => {
    return a.label?.localeCompare(b.label, undefined, { sensitivity: 'base' })
  })
}

const CAMP_OPTIONS = computed(() => {
  return sortCampList(campList.map((camp: any) => {
    return {
      label: camp.name,
      value: camp.uid,
    }
  }))
})

const addressSelection = computed(() => {
  if (campForm.value.addressType === 'Letter') {
    return CAMP_ADDRESS_OPTIONS.filter((address) => {
      return address.charAt(0).match(/[a-z]/i)
    })
  }

  if (campForm.value.addressType === 'Number') {
    return CAMP_ADDRESS_OPTIONS.filter((address) => {
      return address.charAt(0).match(/[0-9]/i)
    })
  }

  if (campForm.value.addressType === 'Center Camp Plaza')
    return CENTER_CAMP_ADDRESS_OPTIONS

  return []
})
</script>

<template>
  <div class="w-80 text-left">
    <div v-if="!isLoggedIn" class="text-center">
      <h2 class="my-4">
        Add your camp's location
      </h2>
      <p>
        Please
        <NuxtLink to="/login" class="text-teal-600 underline">log in</NuxtLink>
        to add or update a camp's location on the map.
      </p>
    </div>

    <div v-else-if="!isSuccess">
      <FormKit type="form" @submit="addCampLocation">
        <FormKit v-model="campForm" type="group">
          <h2 class="my-4">
            Use the form below to add your camp's location!
          </h2>
          <FormKit
            type="select"
            placeholder="Select"
            name="id"
            label="Camp Name"
            validation="required"
            :options="CAMP_OPTIONS"
          />
          <FormKit
            type="select"
            placeholder="Select"
            name="addressType"
            label="Address Type"
            help="Is your camp located on a letter or a number street, or within Center Camp Plaza/Rod's Ring Road?"
            validation="required"
            :options="[
              { label: 'Letter', value: 'Letter' },
              { label: 'Number', value: 'Number' },
              { label: 'Center Camp/Rods Ring Road', value: 'Center Camp Plaza' },
            ]"
          />
          <FormKit
            type="select"
            placeholder="Select"
            name="address"
            label="Address"
            validation="required"
            :options="addressSelection"
          />
        </FormKit>
      </FormKit>
      <span v-if="isLoading">Saving…</span>
      <span v-if="isError" class="text-red-600">An error occurred: {{ error }}</span>
    </div>

    <div v-else class="my-4">
      <h4>Thank you — your camp's location is on the map!</h4>
    </div>
  </div>
</template>
