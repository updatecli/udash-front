<template>
  <v-container
      class="py-8 px-6"
      fluid
  >
    <!-- Show Project Description -->
    <v-container>
      <!--
        Show Project application in a table
      -->
      <v-row>
        <v-col
            cols="auto"
            lg="12"
            md="12"
            sm="12"
          >

          <!-- <SCMSummary :scmid="scmid"/>-->


          <v-data-table-virtual
            v-model:items-per-page="itemsPerPage"
            :headers="pipelinesHeaders"
            :items="pipelines"
            item-value="name"
            fixed-header
            max-height="600px"
          >
            <!-- Disabling sort-by for now as I find it a bit confusing :sort-by="sortBy"-->
            <template v-slot:item.ID="{ item }">
              <v-btn
                class="mx-4"
                variant="text"
                prepend-icon="mdi-arrow-right-circle"
                :to=getPipelineLink(item.ID)></v-btn>
            </template>
            <template v-slot:item.Result="{ item }">
              <v-icon
                :icon=getStatusIcon(item.Result)
                :color=getStatusColor(item.Result)
                ></v-icon>
            </template>
            <template v-slot:item.UpdatedAt="{ item }">
              {{ toLocalDate(item.UpdatedAt) }}
            </template>
          </v-data-table-virtual>

          <v-pagination
            v-model="currentPage"
            :length="Math.ceil(totalItems / itemsPerPage)"
            :total-visible="7"
            @update:model-value="onPageChange"
          ></v-pagination>

          <div class="text-center mt-2">
            <small>Total: {{ totalItems }} reports</small>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>

import { getStatusColor, getStatusIcon } from '@/composables/status';
import { toLocalDate } from '@/composables/date'

export default {
  name: 'PipelinesTable',

  props: {
    scmid: {},
  },

  data: () => ({
    sortBy: [{
      key: 'UpdatedAt',
      order: 'desc'
    }],
    pipelinesHeaders: [
      { title: "State", align: "start", key:'Result'},
      { title: "Time", key:'UpdatedAt'},
      {
        title: "Name",
        align: 'start',
        sortable: true,
        key: 'Name'
      },
      { key: 'ID', sortable: false}
    ],
    pipelines: [],
    itemsPerPage: 25,
    totalItems: 0,
    currentPage: 1,
  }),

  watch: {
    scmid() {
        this.currentPage = 1;
        this.getReportsData(1)
    }
  },

  methods: {
    toLocalDate (rawDate) {
      return toLocalDate(rawDate)
    },

    async getReportsData(page =1 ) {
      this.$emit('loaded', false)
      let queryURL = `/api/pipeline/reports`

      const params = new URLSearchParams();
      if (this.scmid != undefined && this.scmid != '' && this.scmid != null) {
        params.append('scmid', this.scmid);
      }

      params.append('limit', this.itemsPerPage);
      params.append('page',  this.currentPage);

      queryURL += `?${params.toString()}`;

      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      try {
        let response;
        if (isAuthEnabled) {
          const token = await this.$auth0.getAccessTokenSilently();
          response = await fetch(queryURL, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        } else {
          response = await fetch(queryURL);
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Update both pipelines and total count
        this.pipelines = data.data || data.reports || []; // Handle different response structures
        this.totalItems = data.total_count || 0;
        this.currentPage = page;

      } catch (error) {
        console.error('Error fetching reports:', error);
        this.pipelines = [];
        this.totalItems = 0;
      }

      this.$emit('loaded', true)

    },
    onPageChange(page) {
      this.getReportsData(page);
    },
    getPipelineLink: function(id){
      return `/pipeline/reports/${id}`
    },
    getStatusColor: function(status){
      return getStatusColor(status);
    },
    getStatusIcon: function(status){
      return getStatusIcon(status);
    },
  },

  async created() {
    try {
      this.getReportsData(1)
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
