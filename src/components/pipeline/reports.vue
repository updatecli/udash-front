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

          <v-data-table
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="pipelines"
            item-value="name"
            density="compact"
            fixed-header
            max-height="600px"
          >
            <template v-slot:item.ID="{ item }">
              <v-btn
                class="mx-4"
                variant="text"
                prepend-icon="mdi-arrow-right-circle"
                :to=getPipelineLink(item.raw.ID)></v-btn>
            </template>
            <template v-slot:item.Result="{ item }">
              <v-icon
                :icon=getStatusIcon(item.raw.Result)
                :color=getStatusColor(item.raw.Result)
                ></v-icon>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { VDataTable } from 'vuetify/labs/VDataTable'

export default {
  name: 'PipelinesTable',

  components: {
    VDataTable,
  },

  data: () => ({
    pipelines: [],
    itemsPerPage: 10,
    headers: [
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
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {
    async getReportsData() {
      const token = await this.$auth0.getAccessTokenSilently();
      const response = await fetch('/api/pipeline/reports', {
          headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      this.pipelines = data.data
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

  async created() {
    try {
      this.getReportsData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
