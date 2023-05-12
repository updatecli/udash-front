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
        {{ pipeline.Pipeline }}
        {{ pipeline.Name }}
        {{ pipeline.Sources }}
        {{ pipeline.Conditions }}
        {{ pipeline.Targets }}

        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>

export default {
  name: 'PipelineDashboard',

  data: () => ({
    pipeline: [],
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {
    getPipelineLink: function(id){
      return "/pipelines/" + id
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
          return "yellow"
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
    async getPipelineData() {
      const token = await this.$auth0.getAccessTokenSilently();
      const response = await fetch('/api/pipelines/' + this.$route.params.id, {
          headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      this.pipeline = data.data
    },
  },

  async created() {
    try {
      this.getPipelineData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
