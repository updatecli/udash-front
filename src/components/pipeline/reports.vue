<template>
  <v-container
      class="py-8 px-6"
      fluid
  >
    <v-overlay
      :model-value="isLoading"
      class="align-center justify-center"
      :disabled=true
      :eager=true
      :no-click-animation=true
      :persistent=true
    >
      <v-progress-circular
        color="black"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>

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
          </v-data-table-virtual>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import router from '../../router'
//import SCMSummary from '../scm/_summary.vue'

export default {
  name: 'PipelinesTable',
  //components: {
  //  SCMSummary,
  //},

  props: {
    scmid: {},
  },

  data: () => ({
    pipelinesHeaders: [
      { title: "State", align: "start", key:'Result'},
      {
        title: "Name",
        align: 'start',
        sortable: true,
        key: 'Name'
      },
      { title: "Created at", key:'CreatedAt'},
      { title: "Updated at", key:'UpdatedAt'},
      { key: 'ID', sortable: false}
    ],
    pipelines: [],
    isLoading: true,
    itemsPerPage: 25,
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {
    async getReportsData() {

      let queryURL = `/api/pipeline/reports`

      if (this.scmid != undefined && this.scmid != '' && this.scmid != null) {
        queryURL = queryURL + `?scmid=${this.scmid}`
      }

      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      if (isAuthEnabled){
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch(queryURL, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        this.isLoading = false
        this.pipelines = data.data
      } else {
        const response = await fetch(queryURL);
        const data = await response.json();
        this.isLoading = false
        this.pipelines = data.data
      }
    },
    getPipelineLink: function(id){
      return `/pipeline/reports/${id}`
    },
    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
    getStatusColor: function(status){
      switch (status) {
        case "✔":
          return "success"
        case "✗":
          return "red"
        case "⚠":
          return "orange"
        case "-":
          return "grey"
        default:
          return "blue"
      }
    },
    getStatusIcon: function(status){
      switch (status) {
        case "✔":
          return "mdi-robot-love"
        case "✗":
          return "mdi-robot-angry"
        case "⚠":
          return "mdi-robot-confused"
        default:
          return "mdi-robot-off"
      }
    },
  },

  watch: {
      isLoading (val) {
        val && setTimeout(() => {
          this.isLoading = false
        }, 3000)
      },

      scmid () {
        this.getReportsData()
      },
  },

  async created() {
    try {
      //// Set the scmid from the query parameter
      //router.push({ query: { scmid: "xxx" } })
      if (router.currentRoute.value.query.scmid != undefined) {
        let scmid = router.currentRoute.value.query.scmid
        if (scmid != undefined) {
          this.$emit('update-scmid', scmid)
        }
      }

      this.getReportsData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
