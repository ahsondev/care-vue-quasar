<template>
  <q-page class="items-center justify-evenly" style="padding: 40px">
    <q-card>
      <q-card-section>
        <h1 class="text-h4">Payrolls</h1>
        <q-form style="width: 100%" @submit.stop="onSubmit">
          <div class="row" style="margin-bottom: 15px">
            <div class="col" style="padding-right: 10px">
              <q-select
                v-model="user"
                label="Staff"
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
              label="Export to csv"
              no-caps
              @click="exportTable"
            />
          </template>

          <template v-slot:top-row v-if="rows.length > 0">
            <q-tr style="background: #eee; font-weight: bold">
              <q-td>Summary</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.weekday, 0) * 10) / 10
              }}</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.saturday, 0) * 10) / 10
              }}</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.sunday, 0) * 10) / 10
              }}</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.holiday, 0) * 10) / 10
              }}</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.total, 0) * 10) / 10
              }}</q-td>
              <q-td class="text-right">{{
                Math.round(rows.reduce((a, b) => a + b.mileage, 0) * 10) / 10
              }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, computed } from 'vue';
import tandaClient from '../services/tanda';
import { exportFile, useQuasar } from 'quasar';
import { Parser } from 'json2csv';

export default defineComponent({
  components: {},
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const dateRange = ref({ from: '', to: '' });
    const user: Ref<{ label: string; value: number } | null> = ref(null);
    const options: Ref<{ label: string; value: number }[] | null> = ref([]);
    const dateRangeFormatted = computed(() =>
      dateRange.value?.from && dateRange.value?.to
        ? `${dateRange.value?.from} - ${dateRange.value?.to}`
        : ''
    );
    const canSubmit = computed(
      () => user.value?.value && dateRange.value.from && dateRange.value.to
    );

    tandaClient
      .getUsers()
      .then((resp: { id: number; name: string }[]) => {
        options.value = resp.map((x) => {
          return { label: x.name, value: x.id };
        });
      })
      .catch((_) => {
        console.log(_);
      });

    const rows: Ref<
      {
        date: string;
        weekday: number;
        saturday: number;
        sunday: number;
        holiday: number;
        total: number;
        mileage: number;
      }[]
    > = ref([]);

    async function onSubmit() {
      loading.value = true;

      try {
        const from = dateRange.value.from.replace(/\//g, '-');
        const to = dateRange.value.to.replace(/\//g, '-');

        const resp = await tandaClient.getUserShifts({
          user_id: user.value?.value as number,
          from,
          to,
        });

        rows.value = resp;
      } finally {
        setTimeout(() => {
          loading.value = false;
        }, 500);
      }
    }

    function exportTable() {
      const fields = [
        'date',
        'weekday',
        'saturday',
        'sunday',
        'holiday',
        'total',
        'mileage',
      ];
      const opts = { fields };
      const parser = new Parser(opts);
      const content = parser.parse(rows.value);

      const status = exportFile(
        `${user.value?.label as string}_${dateRange.value.from}_${
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
      user,
      dateRange,
      dateRangeFormatted,
      options,
      rows,
      canSubmit,
      onSubmit,
      exportTable,
    };
  },
});
</script>
