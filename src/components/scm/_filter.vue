<template>
  <v-container
      class="py-8 px-6"
      fluid
  >
    <v-form
      v-model="filterForm"
      @submit.prevent="applyFilter"
    >
      <!-- Repository Dropdown -->
       <v-select
        label="Git Repository"
        :items="repositories"
        :rules="[v => !!v || 'Git repository is required']"
        item-value="id"
        item-title="text"
        prepend-inner-icon="mdi-git"
        v-model="repository"
        ></v-select>

       <v-select
        label="Git Branch"
        :items="branches"
        :rules="[v => !!v || 'Git branch is required']"
        prepend-inner-icon="mdi-source-branch"
        v-model="branch"
        ></v-select>

       <!-- Date Range Slider -->
        <v-range-slider
          v-model="dateRange"
          :reverse="false"
          :min="0"
          :max="30"
          :step="1"
          class="py-6"
          :strict="true"
        >
          <template v-slot:prepend>
            <v-text-field
              :v-model="dateRange[0]"
              density="compact"
              style="width: 150px"
              variant="flat"
              hide-details
              single-line
              class="text-center"
          >{{ stepToISOWithoutTimezone(dateRange[0]) }}</v-text-field>
          </template>

          <template v-slot:append>
            <v-text-field
              :v-model="dateRange[1]"
              density="compact"
              style="width: 150px"
              variant="flat"
              hide-details
              single-line
              class="text-center"
          >{{ stepToISOWithoutTimezone(dateRange[1]) }}</v-text-field>
          </template>
        </v-range-slider>

        <!-- Filter repository-->
        <!--<v-btn type="submit" color="primary" :disabled="!filterForm">Filter</v-btn>-->

        <div
          align="center"
          justify="center"
          class="py-4"
        >
          <v-btn
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


    <div class="text-center">
    </div>

  </v-container>
</template>

<script>
import router from '../../router'

import { getApiBaseURL } from '@/composables/api';

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
  },

  data: () => ({
    filterForm: false,
    scms: [],
    repository: "",
    repositories : [],
    branches: [],
    branch : "",
    restrictedSCM: "",
    dateRange: [0, 24],  // [6 hours ago, now] by default
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
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

        if ( i == 0) {
          this.repository = this.scms[i].URL
          this.branch = this.scms[i].Branch
          this.applyFilter()
          this.$emit('loaded', true)
        }
      }

    },

    isRestrictedSCM() {
      return this.restrictedSCM != ""
    },

    resetRestrictedSCM() {
      const queryParams = { ...router.currentRoute.query }
      delete queryParams.scmid
      router.replace({ query: queryParams })

      this.restrictedSCM = ""
      this.getSCMSData()
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
      return this.scms.find(scm => scm.URL === url && scm.Branch === branch).ID
    },

    applyFilter() {

      var newFilter = {
        scmid: this.getScmID(this.repository, this.branch),
        startTime: this.formattedStartTime,
        endTime: this.formattedEndTime,
      }

      this.$emit('update-filter', newFilter)
    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },

    stepToISO(step) {
      const now = new Date()
      let date = new Date(now)

      if (step < 24) {
        // Hours: step 0 = 1 hour ago, step 23 = 24 hours ago
        date.setHours(date.getHours() - step)
      } else {
        // Days: step 24 = 1 day ago, step 30 = 7 days ago
        const daysAgo = step - 23
        date.setDate(date.getDate() - daysAgo)
      }

      return this.formatToLayout(date)
    },

    stepToISOWithoutTimezone(step) {
      const now = new Date()
      let date = new Date(now)

      if (step < 24) {
        // Hours: step 0 = 1 hour ago, step 23 = 24 hours ago
        date.setHours(date.getHours() - step)
      } else {
        // Days: step 24 = 1 day ago, step 30 = 7 days ago
        const daysAgo = step - 23
        date.setDate(date.getDate() - daysAgo)
      }

      return this.formatToLayoutWithoutTimezone(date)
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
  },

  watch: {
      dateRange(val) {
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
        if (router.currentRoute.value.query.scmid != undefined) {
          this.restrictedSCM = router.currentRoute.value.query.scmid
        } else {
          this.getSCMSData()
        }
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
