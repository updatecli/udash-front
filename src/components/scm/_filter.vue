<template>
  <!-- No horizontal padding below sm. Both views already mount this inside their own
       v-container and v-col, so px-6 here is a second helping of gutters: it costs 48
       of the 360px a phone has, on top of the nav rail's 56 and the expansion panel's
       48, which is what squeezed the date labels onto two lines and stacked the slider
       ticks on top of each other. -->
  <v-container
      class="py-8 px-0 px-sm-6"
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
          v-model="expandedPanels"
          class="mt-4"
          elevation="0"
          multiple
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
                <!-- Pipeline Result and Open Pull Request Selection

                     Both are picked from their name alone, unlike every other control
                     here which can be checked against the rows it returns, so their
                     items carry a subtitle spelling out what each one means.

                     They sit side by side because they are read together: a pipeline
                     reports a success when it had nothing to change, including when the
                     change is already waiting in a pull request nobody merged, and
                     pairing the two is what isolates those. They remain two controls
                     rather than one list of five: an open pull request is a dimension of
                     its own, orthogonal to the result. -->
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      variant="outlined"
                      label="Pipeline Result (Optional)"
                      :items="pipelineResults"
                      :item-props="true"
                      item-value="value"
                      prepend-inner-icon="mdi-list-status"
                      v-model="selectedResults"
                      multiple
                      chips
                      closable-chips
                      clearable
                      hint="Leave empty to show every result"
                      persistent-hint
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      variant="outlined"
                      label="Open Pull Request (Optional)"
                      :items="openActionOptions"
                      :item-props="true"
                      item-value="value"
                      prepend-inner-icon="mdi-source-pull"
                      v-model="selectedOpenAction"
                      clearable
                      hint="Leave empty to show pipelines whether or not one is open"
                      persistent-hint
                    ></v-select>
                  </v-col>
                </v-row>
                <!-- Date Range Labels

                     Oldest on the left, newest on the right, matching the reversed
                     slider below: dateRange[0] is "now" and larger steps go further
                     back, so the second entry is the one that starts the range. -->
                <v-row class="mb-0">
                  <v-col cols="6" class="text-left">
                    <div class="date-range-value">{{ stepToHumanDate(dateRange[1]) }}</div>
                    <div class="date-range-hint text-medium-emphasis">{{ describeRelativeStep(dateRange[1]) }}</div>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="date-range-value">{{ stepToHumanDate(dateRange[0]) }}</div>
                    <div class="date-range-hint text-medium-emphasis">{{ describeRelativeStep(dateRange[0]) }}</div>
                  </v-col>
                </v-row>
                <!-- Date Range Slider -->
                <v-row>
                  <v-col cols="12">
                    <v-range-slider
                      v-model="sliderRange"
                      :reverse="false"
                      :min="0"
                      :max="maxDateStep"
                      :step="1"
                      :ticks="sliderTicks"
                      show-ticks="always"
                      tick-size="3"
                      class="py-2"
                      :strict="true"
                      :disabled="showRepositoryBranch && (!isRepositoriesData() || !isRepositoryBranchesData())"
                    />
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
            justify-center
            class="pl-4"
          >Reset</v-btn>

        </div>
    </v-form>
  </v-container>
</template>

<script>
import router from '../../router'

import { apiFetch } from '@/composables/api';
import { getMaxHistoryDays } from '@/composables/runtime';
import { FILTER_STORAGE_KEY, stepToISO } from '@/composables/date';
import { PIPELINE_RESULTS, PIPELINE_RESULT_VALUES, OPEN_ACTION_OPTIONS, OPEN_ACTION_VALUES, openActionToQuery } from '@/composables/status';
import { encodeFilterState, decodeFilterState } from '@/composables/filter';

// Steps 0-23 are hours ago; from 24 onwards a step is a day, so the step standing
// for D days back is D + DAY_STEP_OFFSET. The default range is deliberately left at
// the last day whatever the configured maximum: widening the slider must not widen
// what every visitor asks the backend for by default.
const DAY_STEP_OFFSET = 23;
const DEFAULT_DATE_RANGE = [0, 24];

export default {
  name: 'PipelineSCMS',

  props: {
    showRepositoryBranch: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['loaded', 'update-filter'],

  data: () => ({
    filterForm: false,
    scms: [],
    repository: "",
    repositories : [],
    branches: [],
    branch : "",
    restrictedSCM: "",
    dateRange: [...DEFAULT_DATE_RANGE],  // [start step, end step] by default
    labelKeys: [],
    labelValuesByKey: {},  // Map to store label values for each key
    selectedLabels: [{ key: null, value: null }],  // Array of label selections
    selectedResults: [],  // Pipeline results to keep, empty meaning all of them
    pipelineResults: PIPELINE_RESULTS,
    selectedOpenAction: null,  // "open", "none", or null meaning both
    openActionOptions: OPEN_ACTION_OPTIONS,
    debounceTimer: null,
    nowTicker: null,
    nowRefreshKey: 0,
    expandedPanels: [],
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
    clearTimeout(this.debounceTimer);
  },

  computed: {
    hasActiveAdvancedFilters() {
      return this.selectedLabels.some(label => label.key !== null) || this.selectedResults.length > 0 || this.selectedOpenAction !== null
    },

    // isCompactDisplay marks the width below which the endpoint labels have to give
    // something up. It is Vuetify's xs breakpoint, the same 600px the scoped media query
    // uses, so the CSS and the JS never disagree about what counts as a small screen.
    isCompactDisplay() {
      return this.$vuetify.display.xs
    },

    // The ticks give up sooner than the endpoint labels do, and at a different width.
    // Crossing out of xs restores this container's px-6, so the track is briefly
    // narrower at 600px than it was at 599; measured, the full anchor set only stops
    // colliding around 768. Hence smAndDown here against xs above.
    hasCrowdedTicks() {
      return this.$vuetify.display.smAndDown
    },

    // sliderTicks marks a handful of anchors along the slider so the scale is
    // readable. Labelling every step is unusable once the range spans weeks, and the
    // exact instants either side are already spelled out in the two labels above it.
    //
    // Anchors follow the same mapping as stepToDate: below 24 a step is an hour, and
    // the step for D days back is D + DAY_STEP_OFFSET.
    sliderTicks() {
      const ticks = {}
      const maxDays = getMaxHistoryDays()

      // Vuetify positions every tick label absolutely and skips none, so anchors falling
      // close together overprint into an unreadable pile rather than dropping out. A
      // phone leaves the track about 190px, room for the two ends and one anchor
      // between them; the instants either side are spelled out above it either way.
      // The middle anchor is worth keeping: the scale is not linear, an hour and a day
      // being the same step apart, so two ends alone would misread.
      if (this.hasCrowdedTicks) {
        ticks[this.toSliderValue(maxDays + DAY_STEP_OFFSET)] = `${maxDays} days`
        ticks[this.toSliderValue(DAY_STEP_OFFSET + 1)] = '1 day'
        ticks[this.toSliderValue(0)] = 'now'
        return ticks
      }

      const hourAnchors = { 0: 'now', 6: '6h', 12: '12h', 18: '18h' }
      Object.entries(hourAnchors).forEach(([step, label]) => {
        ticks[this.toSliderValue(Number(step))] = label
      })

      const dayAnchors = [1, 7, 14, 30, 60, 90, 180, 365].filter((days) => days <= maxDays)

      // Always mark the far end, so how far the filter reaches is legible at a glance.
      if (!dayAnchors.includes(maxDays)) {
        dayAnchors.push(maxDays)
      }

      dayAnchors.forEach((days) => {
        ticks[this.toSliderValue(days + DAY_STEP_OFFSET)] = days === 1 ? '1 day' : `${days} days`
      })

      return ticks
    },

    // sliderRange presents dateRange the way a timeline reads: oldest on the left,
    // now on the right. dateRange itself stays in "steps ago", which is what gets
    // persisted, shared in the URL and turned into timestamps, so nothing downstream
    // has to know about the flip.
    //
    // This is done by mirroring the values rather than with the slider's own reverse
    // prop: reverse leaves the ticks sitting at the minimum and maximum pinned to the
    // wrong ends, which puts "now" and the oldest label on the wrong sides.
    sliderRange: {
      get() {
        return [this.toSliderValue(this.dateRange[1]), this.toSliderValue(this.dateRange[0])]
      },
      set(value) {
        const [older, newer] = [...value].sort((a, b) => a - b)
        this.dateRange = [this.toSliderValue(newer), this.toSliderValue(older)]
      },
    },

    // dateRange[0] is the step closest to now and dateRange[1] the furthest back, so
    // the range starts at the second entry. The API tolerates the two being handed
    // over the wrong way round, which is why this read backwards for so long without
    // breaking anything.
    formattedStartTime() {
      return stepToISO(this.dateRange[1])
    },

    formattedEndTime() {
      return stepToISO(this.dateRange[0])
    },

    // maxDateStep is how far the slider reaches, driven by the instance's configured
    // history window rather than a fixed bound.
    maxDateStep() {
      return DAY_STEP_OFFSET + getMaxHistoryDays()
    },
  },

  methods: {
    // clampStep keeps a restored step inside the slider. A range saved while the
    // instance allowed more history would otherwise survive a lowered
    // MAX_HISTORY_DAYS and keep querying beyond it.
    clampStep(step) {
      return Math.min(Math.max(step, 0), this.maxDateStep)
    },

    // toSliderValue mirrors a step across the track. It is its own inverse, so the
    // same call converts in both directions.
    toSliderValue(step) {
      return this.maxDateStep - step
    },

    // sanitizeResults keeps only the results the API knows about, so a hand-edited
    // URL or a stale local storage entry cannot turn into a query matching nothing.
    sanitizeResults(value) {
      if (!Array.isArray(value)) {
        return []
      }

      return [...new Set(value.filter((result) => PIPELINE_RESULT_VALUES.includes(result)))]
    },

    // sanitizeOpenAction does for the open action what sanitizeResults does for the
    // results: anything the API would not understand becomes "no filter" rather than a
    // query matching nothing.
    sanitizeOpenAction(value) {
      return OPEN_ACTION_VALUES.includes(value) ? value : null
    },

    // toggleResult is what the summary doughnuts call when one of their segments is
    // clicked. Clicking the same segment again clears it, so a click is never a
    // one-way trip into a filter the reader then has to scroll up to undo.
    //
    // Segments standing for one half of a result split on whether a pull request is
    // still open go through toggleResultWithOpenAction instead, so that both dimensions
    // are set together.
    toggleResult(result) {
      const sanitized = this.sanitizeResults([result])
      if (sanitized.length === 0) {
        return
      }

      this.selectedResults = this.selectedResults.includes(sanitized[0])
        ? this.selectedResults.filter((selected) => selected !== sanitized[0])
        : [...this.selectedResults, sanitized[0]]

      // Show what just changed: the control lives in a panel which is collapsed by
      // default, and a filter the reader cannot see is a filter they cannot undo.
      if (!this.expandedPanels.includes(0)) {
        this.expandedPanels = [...this.expandedPanels, 0]
      }

      this.applyFilter()
    },

    // toggleResultWithOpenAction is what the segments split on the open action call, so
    // that clicking "succeeded, waiting to be merged" selects both dimensions in one go
    // rather than leaving the reader with a half applied filter.
    toggleResultWithOpenAction(result, openAction) {
      const wasSelected = this.selectedResults.includes(result) && this.selectedOpenAction === openAction

      this.selectedResults = wasSelected ? [] : [result]
      this.selectedOpenAction = wasSelected ? null : this.sanitizeOpenAction(openAction)

      if (!this.expandedPanels.includes(0)) {
        this.expandedPanels = [...this.expandedPanels, 0]
      }

      this.applyFilter()
    },

    isRepositoriesData() {
      return this.repositories.length > 0
    },

    isRepositoryBranchesData() {
      return this.branches.length > 0
    },

    async getSCMSData() {
      this.$emit('loaded', false)
      try {
        let query = '/pipeline/scms';

        if (this.restrictedSCM != "") {
          query = query + `?scmid=${this.restrictedSCM}`
        }

        const data = await apiFetch(query);
        this.scms = data.scms || []

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
      } catch (error) {
        console.error('Error fetching SCM data:', error)
      } finally {
        this.$emit('loaded', true)
      }
    },

    isRestrictedSCM() {
      return this.restrictedSCM != ""
    },

    async getLabelKeys() {
      try {
        const query = `/pipeline/labels?keyonly=true&start_time=${encodeURIComponent(this.formattedStartTime)}&end_time=${encodeURIComponent(this.formattedEndTime)}`;

        const data = await apiFetch(query);
        this.labelKeys = data.labels || [];
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

        const query = `/pipeline/labels?key=${encodeURIComponent(labelKey)}&start_time=${encodeURIComponent(this.formattedStartTime)}&end_time=${encodeURIComponent(this.formattedEndTime)}`;

        const data = await apiFetch(query);

        // Extract unique values from the labels array
        const uniqueValues = [...new Set((data.labels || []).map(label => label.value))];
        this.labelValuesByKey[labelKey] = uniqueValues;
        return this.labelValuesByKey[labelKey];
      } catch (error) {
        console.error('Error fetching label values:', error);
        return [];
      }
    },

    resetRestrictedSCM() {
      const queryParams = { ...router.currentRoute.value.query }

      delete queryParams.scmid
      delete queryParams.filter

      router.replace({ query: queryParams }).catch(() => {})

      this.clearPersistedFilterState()
      this.repository = ""
      this.branch = ""
      this.restrictedSCM = ""
      this.dateRange = [...DEFAULT_DATE_RANGE]
      this.selectedLabels = [{ key: null, value: null }]
      this.selectedResults = []
      this.selectedOpenAction = null
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

    loadFilterFromURL() {
      try {
        const decoded = decodeFilterState(router.currentRoute.value.query.filter)
        if (!decoded) {
          return false
        }

        if (Array.isArray(decoded.dateRange) && decoded.dateRange.length === 2) {
          const start = Number(decoded.dateRange[0])
          const end = Number(decoded.dateRange[1])
          if (Number.isFinite(start) && Number.isFinite(end)) {
            this.dateRange = [this.clampStep(start), this.clampStep(end)]
          }
        }

        if (Array.isArray(decoded.selectedLabels)) {
          const restoredLabels = decoded.selectedLabels
            .filter((item) => item && typeof item === 'object')
            .map((item) => ({
              key: item.key || null,
              value: item.value || null,
            }))
          this.selectedLabels = restoredLabels.length > 0 ? restoredLabels : [{ key: null, value: null }]
        }

        this.selectedResults = this.sanitizeResults(decoded.selectedResults)
        this.selectedOpenAction = this.sanitizeOpenAction(decoded.selectedOpenAction)

        if (this.showRepositoryBranch) {
          if (typeof decoded.repository === 'string') {
            this.repository = decoded.repository
          }
          if (typeof decoded.branch === 'string') {
            this.branch = decoded.branch
          }
        }

        return true
      } catch (error) {
        console.warn('Unable to load SCM filter from URL parameter', error)
        return false
      }
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
            this.dateRange = [this.clampStep(start), this.clampStep(end)]
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

        this.selectedResults = this.sanitizeResults(savedState.selectedResults)
        this.selectedOpenAction = this.sanitizeOpenAction(savedState.selectedOpenAction)

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
          selectedResults: this.selectedResults,
          selectedOpenAction: this.selectedOpenAction,
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

      if (this.selectedResults.length > 0) {
        newFilter.results = [...this.selectedResults];
      }

      // The API reads the open action as an optional boolean, so an unset filter has to
      // stay absent from the body rather than be sent as false, which would drop every
      // pipeline carrying an open pull request.
      const openAction = openActionToQuery(this.selectedOpenAction);
      if (openAction !== undefined) {
        newFilter.openAction = openAction;
      }

      this.persistFilterState();

      // Keep the URL in sync so the current filter is always shareable
      const urlState = {
        dateRange: this.dateRange,
        selectedLabels: this.selectedLabels,
        selectedResults: this.selectedResults,
        selectedOpenAction: this.selectedOpenAction,
      }
      if (this.showRepositoryBranch) {
        urlState.repository = this.repository
        urlState.branch = this.branch
      }
      router.replace({
        query: { ...router.currentRoute.value.query, filter: encodeFilterState(urlState) },
      }).catch(() => {})

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

    // The weekday goes first when room runs out: it is the one part of a range boundary
    // the date next to it already implies, and it costs about five characters of a line
    // a phone can barely fit.
    formatHumanDate(date) {
      return new Intl.DateTimeFormat(undefined, {
        ...(this.isCompactDisplay ? {} : { weekday: 'short' }),
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
        const urlFilterLoaded = this.loadFilterFromURL()
        if (!urlFilterLoaded) {
          this.loadPersistedFilterState()
        }
        if (this.hasActiveAdvancedFilters) {
          this.expandedPanels = [0]
        }
        this.syncNowAutoUpdate()

        if (this.showRepositoryBranch) {
          if (router.currentRoute.value.query.scmid != undefined) {
            this.restrictedSCM = router.currentRoute.value.query.scmid
          } else {
            this.getSCMSData()
          }
          await this.getLabelKeys()
        } else {
          // When not showing repository/branch selectors, emit the initial
          // time-range filter directly so child components get the correct filter.
          this.$emit('loaded', false)
          await this.getLabelKeys()
          this.applyFilter()
          this.$emit('loaded', true)
        }
    } catch (error) {
      console.log(error);
    }
  },
}
</script>

<style scoped>
/* Plain text rather than a readonly text field: a solo variant spends about 32px a side
   on input padding, which is most of the room a phone has to spell out a date, and the
   box it buys stands for something the reader can never type into. Text also wraps
   where an input clips, so a longer locale format loses a line rather than its end. */
.date-range-value {
  font-size: 0.85rem;
  line-height: 1.25;
}

.date-range-hint {
  font-size: 0.7rem;
  line-height: 1.25;
}

/* Kept in step with isCompactDisplay, which drops the weekday at the same width. */
@media (max-width: 600px) {
  .date-range-value {
    font-size: 0.75rem;
  }

  .date-range-hint {
    font-size: 0.65rem;
  }
}

/* The tick labels keep their default size on a wide track and shrink on a narrow one,
   which buys the three surviving anchors enough room to clear each other at 320px. */
@media (max-width: 960px) {
  .v-slider :deep(.v-slider-track__tick-label) {
    font-size: 0.7rem;
  }
}
</style>
