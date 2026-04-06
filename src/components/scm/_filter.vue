<template>
  <v-container
      class="py-8 px-6"
      fluid
  >
    <v-form
      v-model="filterForm"
      @submit.prevent="applyFilter"
    >
      <!-- Repository and Branch Dropdowns -->
      <v-row v-if="showRepositoryBranch">
        <v-col cols="12" md="6">
          <v-select
            variant="outlined"
            label="Git Repository"
            :items="repositories"
            :rules="[v => !!v || 'Git repository is required']"
            item-value="id"
            item-title="text"
            prepend-inner-icon="mdi-git"
            v-model="repository"
            :disabled="!isRepositoriesData()"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            variant="outlined"
            label="Git Branch"
            :items="branches"
            :rules="[v => !!v || 'Git branch is required']"
            prepend-inner-icon="mdi-source-branch"
            v-model="branch"
            :disabled="!isRepositoryBranchesData()"
          ></v-select>
        </v-col>
      </v-row>

        <!-- Advanced Filter Expansion Panel -->
        <v-expansion-panels
          class="mt-4"
          elevation="0"
        >
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-filter-outline</v-icon>
              Advanced Filter
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <!-- Label Key and Value Selection -->
              <div v-for="(label, index) in selectedLabels" :key="index">
                <v-row class="align-center">
                  <v-col cols="12" sm="5">
                    <v-select
                      variant="outlined"
                      label="Label Key (Optional)"
                      :items="labelKeys"
                      prepend-inner-icon="mdi-label"
                      v-model="label.key"
                      clearable
                      @update:model-value="onLabelKeyChange(index)"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                      variant="outlined"
                      label="Label Value (Optional)"
                      :items="getLabelValuesForIndex(index)"
                      prepend-inner-icon="mdi-label-multiple"
                      v-model="label.value"
                      clearable
                      :disabled="!label.key"
                      @update:model-value="onLabelValueChange(index)"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="1" class="mb-5">
                    <v-spacer></v-spacer>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      @click="removeLabelRow(index)"
                      v-if="selectedLabels.length > 1"
                    ></v-btn>
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      @click="addLabelRow"
                      v-if="index === selectedLabels.length - 1"
                      :disabled="!canAddNewLabelRow()"
                    ></v-btn>
                  </v-col>
                </v-row>
              </div>
                <v-row>
                  <v-col cols="12" sm="12">
                    <!-- Date Range Slider -->
                    <v-range-slider
                      v-model="dateRange"
                      :reverse="false"
                      :min="0"
                      :max="30"
                      :step="1"
                      class="py-6"
                      :strict="true"
                      :disabled="showRepositoryBranch && (!isRepositoriesData() || !isRepositoryBranchesData())"
                    >
                      <template v-slot:prepend>
                        <v-text-field
                          :model-value="stepToHumanDate(dateRange[0])"
                          :hint="describeRelativeStep(dateRange[0])"
                          persistent-hint
                          readonly
                          density="compact"
                          variant="solo"
                          :flat="true"
                          hide-details="auto"
                          class="date-range-field text-center"
                        />
                      </template>

                      <template v-slot:append>
                        <v-text-field
                          :model-value="stepToHumanDate(dateRange[1])"
                          :hint="describeRelativeStep(dateRange[1])"
                          persistent-hint
                          readonly
                          density="compact"
                          variant="solo"
                          :flat="true"
                          hide-details="auto"
                          class="date-range-field text-center"
                        />
                      </template>
                    </v-range-slider>
                  </v-col>
                </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Filter repository-->
        <!--<v-btn type="submit" color="primary" :disabled="!filterForm">Filter</v-btn>-->

        <div
          align="center"
          justify="center"
          class="py-4"
        >
          <v-btn
            :disabled="showRepositoryBranch && (!isRepositoriesData() && !isRepositoryBranchesData())"
            class="pr-4"
            @click="applyFilter"
          >Search</v-btn>

          <v-btn
            v-if="isRestrictedSCM()"
            @click="resetRestrictedSCM"
            color="darken-grey-3"
            justify-center
            class="pl-4"
          >Reset</v-btn>
        </div>
    </v-form>
  </v-container>
</template>

<script>
import router from '../../router'

import { getApiBaseURL } from '@/composables/api';

const FILTER_STORAGE_KEY = 'udash.scm.filter.v1';
const DEFAULT_DATE_RANGE = [0, 24];

export default {
  name: 'PipelineSCMS',

  props: {
    filter: {
      type: Object,
      default: () => ({
        scmid: "",
        startTime: "",
        endTime: "",
      }),
    },
    showRepositoryBranch: {
      type: Boolean,
      default: true,
    },
  },

  data: () => ({
    filterForm: false,
    scms: [],
    repository: "",
    repositories : [],
    branches: [],
    branch : "",
    restrictedSCM: "",
    dateRange: [...DEFAULT_DATE_RANGE],  // [6 hours ago, now] by default
    labelKeys: [],
    labelValuesByKey: {},  // Map to store label values for each key
    selectedLabels: [{ key: null, value: null }],  // Array of label selections
    debounceTimer: null,
    nowTicker: null,
    nowRefreshKey: 0,
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
    clearTimeout(this.debounceTimer);
  },

  computed: {
    tickLabels() {
      const labels = []
      // Hours: 0-23 (1-24 hours ago)
      for (let i = 0; i < 24; i++) {
        if (i === 0) {
          labels.push('now')
          continue
        }
        if (i === 1) {
          labels.push('1 hour')
          continue
        }
        labels.push(`${i} hours`)
      }
      // Days: 24-30 (1-7 days ago)
      for (let i = 0; i < 7; i++) {
        if (i === 0) {
          labels.push('end of today')
          continue
        }
        if (i === 1) {
          labels.push('1 day')
          continue
        }
        labels.push(`${i} days`)
      }
      return labels
    },

    formattedStartTime() {
      return this.stepToISO(this.dateRange[0])
    },

    formattedEndTime() {
      return this.stepToISO(this.dateRange[1])
    },
  },

  methods: {
    isRepositoriesData() {
      return this.repositories.length > 0
    },

    isRepositoryBranchesData() {
      return this.branches.length > 0
    },

    async getSCMSData() {
      this.$emit('loaded', false)
      const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      let query = `${getApiBaseURL()}/pipeline/scms`;

      if (this.restrictedSCM != "") {
        query = query + `?scmid=${this.restrictedSCM}`
      }

      if (auth_enabled) {
        const token = await this.$auth0.getAccessTokenSilently();

        const response = await fetch(query, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        this.scms = data.scms
      } else {

        const response = await fetch(query);
        const data = await response.json();
        this.scms = data.scms
      }

      let urlArray = []
      this.repositories = []
      for (var i = 0 ; i < this.scms.length; i++) {
        if (urlArray.includes(this.scms[i].URL)) {
          continue
        }
        urlArray.push(this.scms[i].URL)

        this.repositories.push({
          id: this.scms[i].URL,
          text: this.prettifyURL(this.scms[i].URL)
        })
      }

      if (this.repositories.length > 0) {
        const hasStoredRepository = this.repositories.some((item) => item.id === this.repository)
        if (!hasStoredRepository) {
          this.repository = this.repositories[0].id
        }

        const repositoryBranches = this.getRepositoryBranches(this.repository)
        this.branches = repositoryBranches
        if (!repositoryBranches.includes(this.branch)) {
          this.branch = repositoryBranches[0] || ''
        }

        this.applyFilter()
      }

      this.$emit('loaded', true)

    },

    isRestrictedSCM() {
      return this.restrictedSCM != ""
    },

    async getLabelKeys() {
      try {
        const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
        let query = `${getApiBaseURL()}/pipeline/labels?keyonly=true&start_time=${encodeURIComponent(this.formattedStartTime)}&end_time=${encodeURIComponent(this.formattedEndTime)}`;

        if (auth_enabled) {
          const token = await this.$auth0.getAccessTokenSilently();
          const response = await fetch(query, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const data = await response.json();
          this.labelKeys = data.labels || [];
        } else {
          const response = await fetch(query);
          const data = await response.json();
          this.labelKeys = data.labels || [];
        }
      } catch (error) {
        console.error('Error fetching label keys:', error);
        this.labelKeys = [];
      }
    },

    async getLabelValues(labelKey) {
      try {
        if (!labelKey) {
          return [];
        }

        // Return cached values if available
        if (this.labelValuesByKey[labelKey]) {
          return this.labelValuesByKey[labelKey];
        }

        const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';
        let query = `${getApiBaseURL()}/pipeline/labels?key=${encodeURIComponent(labelKey)}&start_time=${encodeURIComponent(this.formattedStartTime)}&end_time=${encodeURIComponent(this.formattedEndTime)}`;

        if (auth_enabled) {
          const token = await this.$auth0.getAccessTokenSilently();
          const response = await fetch(query, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const data = await response.json();
          // Extract unique values from the labels array
          const uniqueValues = [...new Set(data.labels.map(label => label.value))];
          this.labelValuesByKey[labelKey] = uniqueValues || [];
          return this.labelValuesByKey[labelKey];
        } else {
          const response = await fetch(query);
          const data = await response.json();
          // Extract unique values from the labels array
          const uniqueValues = [...new Set(data.labels.map(label => label.value))];
          this.labelValuesByKey[labelKey] = uniqueValues || [];
          return this.labelValuesByKey[labelKey];
        }
      } catch (error) {
        console.error('Error fetching label values:', error);
        return [];
      }
    },

    resetRestrictedSCM() {
      const queryParams = { ...router.currentRoute.query }
      delete queryParams.scmid
      router.replace({ query: queryParams })

      this.clearPersistedFilterState()
      this.repository = ""
      this.branch = ""
      this.restrictedSCM = ""
      this.dateRange = [...DEFAULT_DATE_RANGE]
      this.selectedLabels = [{ key: null, value: null }]
      this.labelValuesByKey = {}
      this.getSCMSData()
      this.getLabelKeys()
    },

    prettifyURL: function(url) {
       if (url === undefined) {
           return "";
       }

       url = url.replace(/https?:\/\//, '');
       url = url.replace(/http?:\/\//, '');
       url = url.replace(/\/$/, '');
       url = url.replace(/\.git$/, '');

       return url;
   },


    getScmID(url, branch) {
      return this.scms.find(scm => scm.URL === url && scm.Branch === branch)?.ID
    },

    getRepositoryBranches(repositoryUrl) {
      const repositoryBranches = []

      for (let i = 0; i < this.scms.length; i++) {
        const scm = this.scms[i]
        if (scm.URL !== repositoryUrl) {
          continue
        }

        if (!repositoryBranches.includes(scm.Branch)) {
          repositoryBranches.push(scm.Branch)
        }
      }

      return repositoryBranches
    },

    loadPersistedFilterState() {
      try {
        const rawValue = localStorage.getItem(FILTER_STORAGE_KEY)
        if (!rawValue) {
          return
        }

        const savedState = JSON.parse(rawValue)

        if (Array.isArray(savedState.dateRange) && savedState.dateRange.length === 2) {
          const start = Number(savedState.dateRange[0])
          const end = Number(savedState.dateRange[1])
          if (Number.isFinite(start) && Number.isFinite(end)) {
            this.dateRange = [start, end]
          }
        }

        if (Array.isArray(savedState.selectedLabels)) {
          const restoredLabels = savedState.selectedLabels
            .filter((item) => item && typeof item === 'object')
            .map((item) => ({
              key: item.key || null,
              value: item.value || null,
            }))

          this.selectedLabels = restoredLabels.length > 0 ? restoredLabels : [{ key: null, value: null }]
        }

        if (this.showRepositoryBranch) {
          if (typeof savedState.repository === 'string') {
            this.repository = savedState.repository
          }

          if (typeof savedState.branch === 'string') {
            this.branch = savedState.branch
          }
        }
      } catch (error) {
        console.warn('Unable to restore persisted SCM filter state', error)
      }
    },

    persistFilterState() {
      try {
        const stateToPersist = {
          dateRange: this.dateRange,
          selectedLabels: this.selectedLabels,
          repository: this.showRepositoryBranch ? this.repository : '',
          branch: this.showRepositoryBranch ? this.branch : '',
          updatedAt: new Date().toISOString(),
        }

        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(stateToPersist))
      } catch (error) {
        console.warn('Unable to persist SCM filter state', error)
      }
    },

    clearPersistedFilterState() {
      try {
        localStorage.removeItem(FILTER_STORAGE_KEY)
      } catch (error) {
        console.warn('Unable to clear persisted SCM filter state', error)
      }
    },

    applyFilter() {

      var newFilter = {
        startTime: this.formattedStartTime,
        endTime: this.formattedEndTime,
      }

      if (this.showRepositoryBranch) {
        newFilter.scmid = this.getScmID(this.repository, this.branch)
      }

      // Build labels as map[string]string as expected by the API.
      // An empty value means: filter by key regardless of value.
      const labels = {};
      const seen = new Set();
      for (const label of this.selectedLabels) {
        if (label.key) {
          if (seen.has(label.key)) {
            continue;
          }

          seen.add(label.key);
          labels[label.key] = label.value || "";
        }
      }
      if (Object.keys(labels).length > 0) {
        newFilter.labels = labels;
      }

      this.persistFilterState();

      this.$emit('update-filter', newFilter)
    },

    cancelAutoUpdate() {
      if (this.nowTicker) {
        clearInterval(this.nowTicker);
        this.nowTicker = null;
      }
    },

    rangeIncludesNow() {
      return Array.isArray(this.dateRange) && this.dateRange.includes(0)
    },

    syncNowAutoUpdate() {
      if (!this.rangeIncludesNow()) {
        this.cancelAutoUpdate();
        return;
      }

      if (this.nowTicker) {
        return;
      }

      this.nowTicker = setInterval(() => {
        this.nowRefreshKey += 1;
      }, 30000);
    },

    stepToDate(step) {
      this.nowRefreshKey;
      const now = new Date(Date.now())
      const date = new Date(now)

      if (step < 24) {
        date.setHours(date.getHours() - step)
      } else {
        const daysAgo = step - 23
        date.setDate(date.getDate() - daysAgo)
      }

      return date
    },

    stepToISO(step) {
      return this.formatToLayout(this.stepToDate(step))
    },

    stepToISOWithoutTimezone(step) {
      return this.formatToLayoutWithoutTimezone(this.stepToDate(step))
    },

    formatHumanDate(date) {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
    },

    describeRelativeStep(step) {
      if (step === 0) {
        return 'Now'
      }

      if (step < 24) {
        return step === 1 ? '1 hour ago' : `${step} hours ago`
      }

      const daysAgo = step - 23
      return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
    },

    stepToHumanDate(step) {
      const date = this.stepToDate(step)
      return this.formatHumanDate(date)
    },

    tickLabel(label) {

      if (label < 24 ){
        // Hours: 0-23 (1-24 hours ago)
        if (label === 0) {
          return 'now'
        }
        if (label === 1) {
          return '1 hour'
        }
        return `${label} hours`
      }
      else {
        // Days: 24-30 (1-7 days ago)
        const daysAgo = label - 24
        if (daysAgo === 0) {
          return 'end of today'
        }
        if (daysAgo === 1) {
          return '1 day'
        }
        return `${daysAgo} days`
      }
    },

    formatToLayout(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      const offset = -date.getTimezoneOffset()
      const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
      const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0')
      const sign = offset >= 0 ? '+' : '-'
      const tzOffset = `${sign}${offsetHours}:${offsetMinutes}`

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${tzOffset}`
    },

    formatToLayoutWithoutTimezone(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },

    getLabelValuesForIndex(index) {
      const labelKey = this.selectedLabels[index].key;
      const values = this.labelValuesByKey[labelKey] || [];
      
      // Filter out values that are already selected with this key in other rows
      return values.filter(value => {
        return !this.selectedLabels.some((label, i) => {
          if (i === index) return false; // Don't compare with itself
          return label.key === labelKey && label.value === value;
        });
      });
    },

    async onLabelKeyChange(index) {
      const labelKey = this.selectedLabels[index].key;

      const isDuplicateKey = this.selectedLabels.some((selectedLabel, selectedIndex) => {
        if (selectedIndex === index || !labelKey) {
          return false;
        }

        return selectedLabel.key === labelKey;
      });

      if (isDuplicateKey) {
        this.selectedLabels[index].key = null;
        this.selectedLabels[index].value = null;
        return;
      }

      if (labelKey) {
        await this.getLabelValues(labelKey);
      }
      // Clear value when key changes
      this.selectedLabels[index].value = null;
    },

    onLabelValueChange(index) {
      const label = this.selectedLabels[index];
      if (!label.key || !label.value) {
        return;
      }

      const isDuplicatePair = this.selectedLabels.some((selectedLabel, selectedIndex) => {
        if (selectedIndex === index) {
          return false;
        }

        return selectedLabel.key === label.key && selectedLabel.value === label.value;
      });

      if (isDuplicatePair) {
        this.selectedLabels[index].value = null;
      }
    },

    canAddNewLabelRow() {
      // Don't allow adding a new row if the last row is incomplete
      const lastLabel = this.selectedLabels[this.selectedLabels.length - 1];
      return !!lastLabel.key;
    },

    addLabelRow() {
      if (this.canAddNewLabelRow()) {
        this.selectedLabels.push({ key: null, value: null });
      }
    },

    removeLabelRow(index) {
      if (this.selectedLabels.length > 1) {
        this.selectedLabels.splice(index, 1);
      }
    },
  },

  watch: {
      dateRange(val) {
        this.syncNowAutoUpdate()

        // Ensure start and end are never equal
        if (val[0] === val[1]) {
          if (val[0] === 0) {
            // If at minimum, push end forward
            this.$nextTick(() => {
              this.dateRange = [0, 1]
            })
          } else {
            // Otherwise, pull start backward
            this.$nextTick(() => {
              this.dateRange = [val[0] - 1, val[1]]
            })
          }
          return
        }

        // Emit only if valid (not equal)
        const startTime = this.stepToISO(val[0])
        const endTime = this.stepToISO(val[1])
        this.$emit('date-range-changed', { startTime, endTime })

        // Debounce label refresh to avoid an API call on every slider tick
        clearTimeout(this.debounceTimer)
        this.debounceTimer = setTimeout(() => {
          this.labelValuesByKey = {}
          this.getLabelKeys()
        }, 500)
      },
      repository (val) {
        var newRepositoryBranches = []
        for (var i =0 ; i < this.scms.length; i++) {
          if (this.scms[i].URL == val) {
            if (newRepositoryBranches.includes(this.scms[i].Branch)) {
              continue
            }
              newRepositoryBranches.push(this.scms[i].Branch)
          }
        }

        if (newRepositoryBranches.length == 0) {
          this.branches = []
          this.branch = ""
          return
        }else {
          this.branches = newRepositoryBranches
          this.branch = newRepositoryBranches[0]
        }
      },

      restrictedSCM () {
        this.getSCMSData()
      },
  },

  async created() {
    try {
        this.loadPersistedFilterState()
        this.syncNowAutoUpdate()

        if (this.showRepositoryBranch) {
          if (router.currentRoute.value.query.scmid != undefined) {
            this.restrictedSCM = router.currentRoute.value.query.scmid
          } else {
            this.getSCMSData()
          }
        }
        // Load label keys on component creation
        await this.getLabelKeys();
    } catch (error) {
      console.log(error);
    }
  },
}
</script>

<style scoped>
.date-range-field {
  width: 240px;
}

.date-range-field :deep(input) {
  text-align: center;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.78);
}
</style>
