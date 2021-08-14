<template>
  <q-page class="items-center justify-evenly" style="padding: 40px">
    <q-card>
      <q-card-section>
        <h1 class="text-h4">Settings</h1>
        <q-file
          filled
          bottom-slots
          v-model="inventoryFile"
          label="Xero inventory file"
          @update:model-value="parseCsv"
          counter
        >
          <template v-slot:prepend>
            <q-icon name="cloud_upload" @click.stop />
          </template>
          <template v-slot:append>
            <q-icon
              name="close"
              @click.stop="model = null"
              class="cursor-pointer"
            />
          </template>

          <template v-slot:hint> File size </template>
        </q-file>
        <q-table
          style="margin-top: 30px"
          :rows="inventoryItems"
          :columns="[
            {
              name: 'itemCode',
              field: 'itemCode',
              label: 'Item Code',
              align: 'left',
              style: 'width:200px;',
            },
            {
              name: 'itemShortCode',
              field: 'itemShortCode',
              label: 'Short Code',
              align: 'left',
              style: 'width:100px;',
            },
            {
              name: 'description',
              field: 'description',
              label: 'Description',
              align: 'left',
              style: 'width:500px; white-space: initial',
            },
            {
              name: 'unitPrice',
              field: 'unitPrice',
              label: 'Unit Price',
              align: 'left',
            },
            {
              name: 'salesTaxRate',
              field: 'salesTaxRate',
              label: 'Sales Tax',
              align: 'left',
            },
          ]"
          row-key="itemCode"
          title="Inventory Items"
          color="primary"
          :hide-pagination="true"
          :pagination="{ rowsPerPage: 10000 }"
        >
          <template v-slot:top-right v-if="inventoryItems.length > 0">
            <q-btn
              @click="saveInventoryItems"
              color="primary"
              icon-right="save"
              label="Save"
              no-caps
            />
          </template>
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="itemCode" :props="props">
                {{ props.row.itemCode }}
              </q-td>
              <q-td key="itemShortCode" :props="props">
                {{ props.row.itemShortCode }}
              </q-td>
              <q-td key="description" :props="props">
                <div
                  v-html="
                    props.row.description.replace(/(?:\r\n|\r|\n)/g, '<br/>')
                  "
                ></div>
              </q-td>
              <q-td key="unitPrice" :props="props">
                {{ props.row.unitPrice }}
              </q-td>
              <q-td key="salesTaxRate" :props="props">
                {{ props.row.salesTaxRate }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';
import Papa from 'papaparse';
import { InventoryItem } from '../models';
import inventoryService from '../services/inventoryService';
import { useQuasar } from 'quasar';

interface CsvInventoryItem {
  '*ItemCode': string;
  ItemName: string;
  SalesDescription: string;
  SalesUnitPrice: number;
  SalesAccount: string;
  SalesTaxRate: string;
}

export default defineComponent({
  name: 'Settings',
  components: {},
  setup() {
    const $q = useQuasar();
    const inventoryFile: Ref<File | null> = ref(null);
    const inventoryItems: Ref<Array<InventoryItem>> = ref([]);
    void inventoryService.getInventoryItems().then((list) => {
      inventoryItems.value = list;
    });

    return {
      inventoryFile,
      inventoryItems,
      saveInventoryItems: () => {
        void inventoryService
          .saveInventoryItems(inventoryItems.value)
          .then(() => {
            $q.notify({
              message: 'Inventory items updated',
              color: 'positive',
              icon: 'info',
            });
          });
      },
      parseCsv: () => {
        if (!inventoryFile.value) {
          return;
        }

        Papa.parse(inventoryFile.value, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            inventoryItems.value = (
              results.data as Array<CsvInventoryItem>
            ).map((x) => {
              return {
                itemCode: x['*ItemCode'],
                itemShortCode: x.ItemName.includes('_')
                  ? x.ItemName.split('_')[0]
                  : '',
                itemName: x.ItemName,
                description: x.SalesDescription,
                unitPrice: x.SalesUnitPrice,
                salesAccount: x.SalesAccount,
                salesTaxRate: x.SalesTaxRate,
              } as InventoryItem;
            });
          },
        });
      },
    };
  },
});
</script>
