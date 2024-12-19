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
            :sort-by="sortBy"
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
    itemsPerPage: 25,
  }),

  watch: {
    scmid() {
        this.getReportsData()
    }
  },

  methods: {
    async getReportsData() {
      this.$emit('loaded', false)
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
        this.pipelines = data.data
      } else {
        const response = await fetch(queryURL);
        const data = await response.json();
        this.pipelines = data.data
      }
      this.$emit('loaded', true)
    },
    getPipelineLink: function(id){
      return `/pipeline/reports/${id}`
    },
    getStatusColor: function(status){
      switch (status) {
        case "✔":
          return "green"
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
        case "-":
          return "mdi-robot-off"
        default:
          return "mdi-robot-dead"
      }
    },
  },

  async created() {
    try {
      this.getReportsData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
