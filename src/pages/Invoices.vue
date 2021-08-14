<template>
  <q-page class="items-center justify-evenly" style="padding: 40px">
    <q-card>
      <q-card-section>
        <h1 class="text-h4">Invoices</h1>
        <q-form style="width: 100%" @submit.stop="onSubmit">
          <div class="row" style="margin-bottom: 15px">
            <div class="col" style="padding-right: 10px">
              <q-select
                v-model="department"
                label="Client"
                :options="options"
                style="width: 100%"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      No results
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col" style="padding-left: 10px">
              <q-input label="Date Range *" :model-value="dateRangeFormatted">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date range v-model="dateRange" mask="YYYY-MM-DD">
                        <div class="row items-center justify-end">
                          <q-btn
                            v-close-popup
                            label="Close"
                            color="primary"
                            flat
                          />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <q-btn
            label="Load Timesheet"
            type="submit"
            color="primary"
            :loading="loading"
            :disable="!canSubmit"
          />
        </q-form>

        <q-table
          style="margin-top: 30px"
          :columns="columns"
          :rows="rows"
          row-key="name"
          title="Timesheet"
          color="primary"
          :loading="loading"
          :hide-pagination="true"
          :pagination="{ rowsPerPage: 100 }"
        >
          <template v-slot:top-right v-if="rows.length > 0">
            <q-btn
              color="primary"
              icon-right="archive"
              label="Export for Xero"
              no-caps
              @click="exportTable"
            />
          </template>

          <template v-slot:top-row v-if="rows.length > 0">
            <q-tr style="background: #eee; font-weight: bold">
              <q-td colspan="5">Summary</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.hours, 0) * 100) / 100
              }}</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.mileage, 0) * 100) / 100
              }}</q-td>
            </q-tr>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="date" :props="props">
                {{ props.row.date }}
                {{
                  props.row.dateDescription
                    ? ` (${props.row.dateDescription})`
                    : ''
                }}
              </q-td>
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
              <q-td key="lateCancellation" :props="props">
                {{ props.row.lateCancellation ? 'Yes' : 'No' }}
              </q-td>
              <q-td key="hours" :props="props">
                {{ props.row.hours }}
              </q-td>
              <q-td key="mileage" :props="props">
                {{ props.row.mileage }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed } from 'vue';
import tandaClient, { DepartmentShift } from '../services/tanda';
import inventoryService from '../services/inventoryService';
import { exportFile, useQuasar } from 'quasar';
import { Parser } from 'json2csv';

interface DataRow {
  itemCode: string;
  itemShortCode: string;
  description: string;
  date: string;
  dateDescription: string;
  hours: number;
  lateCancellation: boolean;
  unitPrice: number;
  salesAccount: string;
  salesTaxRate: string;
  mileage: number;
}

export default defineComponent({
  components: {},
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const dateRange = ref({ from: '', to: '' });
    const department: Ref<{
      label: string;
      value: { id: number; name: string }[];
    } | null> = ref(null);
    const columns = [
      {
        name: 'date',
        field: 'date',
        label: 'Date',
        align: 'left',
      },
      {
        name: 'itemCode',
        field: 'itemCode',
        label: 'Item Code',
        align: 'left',
      },
      {
        name: 'itemShortCode',
        field: 'itemShortCode',
        label: 'Short Code',
        align: 'left',
      },
      {
        name: 'description',
        label: 'Description',
        field: 'description',
        align: 'left',
        style: 'width:500px; white-space: initial',
      },
      {
        name: 'lateCancellation',
        field: 'lateCancellation',
        label: 'Cancellation',
        align: 'center',
      },
      {
        name: 'hours',
        field: 'hours',
        label: 'Hours',
        align: 'right',
      },
      {
        name: 'mileage',
        field: 'mileage',
        label: 'Mileage',
        align: 'right',
      },
    ];
    const options: Ref<
      | {
          label: string;
          value: { id: number; name: string }[];
        }[]
      | null
    > = ref([]);
    const dateRangeFormatted = computed(() =>
      dateRange.value?.from && dateRange.value?.to
        ? `${dateRange.value?.from} - ${dateRange.value?.to}`
        : ''
    );
    const canSubmit = computed(
      () => dateRange.value.from && dateRange.value.to
    );

    void tandaClient.getDepartments().then(
      (
        resp: {
          key: string;
          value: { id: number; name: string }[];
        }[]
      ) => {
        options.value = resp.map((x) => {
          return { label: x.key, value: x.value };
        });
      }
    );

    const rows: Ref<DataRow[]> = ref([]);

    async function onSubmit() {
      loading.value = true;

      try {
        const from = dateRange.value.from.replace(/\//g, '-');
        const to = dateRange.value.to.replace(/\//g, '-');
        const resp = await tandaClient.getDepartmentShifts({
          department_ids: department.value?.value.map((e) => e.id) as number[],
          from: from,
          to: to,
        });

        rows.value = await convertToRows(resp);
      } finally {
        setTimeout(() => {
          loading.value = false;
        }, 500);
      }
    }

    async function convertToRows(shifts: DepartmentShift[]) {
      const inventoryItems = await inventoryService.getInventoryItems();
      return shifts.map((x, i) => {
        const team = department.value?.value.find(
          (e) => e.id === x.departmentId
        );

        let shortCode = team?.name.includes('|') ? team.name.split('|')[0] : '';

        const lateCancellation = shortCode.startsWith('L');
        shortCode = lateCancellation ? shortCode.substring(1) : shortCode;
        const item = shortCode
          ? inventoryItems.find((x) => x.itemShortCode === shortCode)
          : null;

        return {
          index: i,
          date: x.date,
          dateDescription:
            x.holiday > 0
              ? 'PUB'
              : x.sunday > 0
              ? 'SUN'
              : x.saturday > 0
              ? 'SAT'
              : '',
          itemCode: item?.itemCode,
          itemShortCode: shortCode,
          description: `${lateCancellation ? 'Late Cancellation - ' : ''}${
            item?.description ?? ''
          }\nDate: ${x.date}`,
          hours: x.hours,
          mileage: x.mileage,
          lateCancellation: lateCancellation,
          unitPrice: item?.unitPrice ?? 0,
          salesAccount: item?.salesAccount,
          salesTaxRate: item?.salesTaxRate,
        } as DataRow;
      });
    }

    function exportTable() {
      const fields = [
        '*ContactName',
        '*InvoiceNumber',
        'Reference',
        '*InvoiceDate',
        '*DueDate',
        'InventoryItemCode',
        '*Description',
        '*Quantity',
        '*UnitAmount',
        '*AccountCode',
        '*TaxType',
      ];
      // const fields = ['date', 'hours', 'mileage'];
      const opts = { fields };
      const parser = new Parser(opts);
      const contactName = department.value?.label.trim();
      const today = new Date();
      const invoiceDate = new Intl.DateTimeFormat('en-AU').format(today);
      const invoiceNumber = `INV-${today
        .getFullYear()
        .toString()
        .substring(2)}${(today.getMonth() + 1)
        .toString()
        .padStart(2, '0')}${today.getDay().toString().padStart(2, '0')}${today
        .getMilliseconds()
        .toString()
        .padStart(3, '0')}`;
      const content = parser.parse(
        rows.value.map((x) => {
          return {
            '*ContactName': contactName,
            '*InvoiceNumber': invoiceNumber,
            Reference: '',
            '*InvoiceDate': invoiceDate,
            '*DueDate': invoiceDate,
            InventoryItemCode: x.itemCode,
            '*Description': x.description,
            '*Quantity': x.hours,
            '*UnitAmount': x.unitPrice,
            '*AccountCode': x.salesAccount,
            '*TaxType': x.salesTaxRate,
          };
        })
      );

      const status = exportFile(
        `${department.value?.label as string}_${dateRange.value.from}_${
          dateRange.value.to
        }.csv`,
        content,
        'text/csv'
      );

      if (status !== true) {
        $q.notify({
          message: 'Browser denied file download...',
          color: 'negative',
          icon: 'warning',
        });
      }
    }

    return {
      loading,
      department,
      dateRange,
      dateRangeFormatted,
      options,
      columns,
      rows,
      canSubmit,
      onSubmit,
      exportTable,
    };
  },
});
</script>
