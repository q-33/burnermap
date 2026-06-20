<script setup lang="ts">
import '@coreui/coreui/dist/css/coreui.min.css'

import { NCollapse, NCollapseItem } from 'naive-ui'
import type { LocationDictionary } from '../../../types/camp'

const props = defineProps<{
  camps: LocationDictionary | undefined
}>()
</script>

<template>
  <div v-for="(item, key) in props.camps" :key="key" class="my-4">
    {{ key }}
    <NCollapse v-for="(campArray, index) in item" :key="index" accordion class="my-1 border py-4">
      <div>
        <NCollapseItem :title="campArray.name" name="1">
          <div class="p-2 text-left">
            <h5>Camp Description</h5>
            <p>{{ campArray.description }}</p>
            <h5>Hometown</h5>
            <p>{{ campArray.hometown }}</p>
            <h5>Contact Email</h5>
            <p>{{ campArray.contact_email }}</p>
          </div>
        </NCollapseItem>
      </div>
    </NCollapse>
  </div>
</template>
