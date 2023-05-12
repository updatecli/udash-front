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

          <v-table
            density="compact"
            fixed-header
            max-height="600px"
          >
            <thead>
              <tr>
                <th>
                </th>
                <th class="text-left">
                  Name
                </th>
                <th class="text-left">
                  Created At
                </th>
                <th class="text-left">
                  Updated At
                </th>
                <th class="text-left">
                  Result
                </th>
                <th class="text-left">
                </th>
              </tr>
            </thead>

            <tbody
              v-for="pipeline in pipelines" :key="pipeline.ID"
              >
              <tr>
                <td><v-icon :icon=getStatusIcon(pipeline.Result) :color=getStatusColor(pipeline.Result)></v-icon></td>
                <td>{{ pipeline.Name }}</td>
                <td>{{ pipeline.CreatedAt }}</td>
                <td>{{ pipeline.UpdatedAt }}</td>
                <td>{{ pipeline.Result }}</td>
                <td>
                  <v-btn
                    class="mx-4"
                    variant="text"
                    prepend-icon="mdi-arrow-right-circle"
                    :to=getPipelineLink(pipeline.ID)></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>

export default {
  name: 'PipelinesTable',

  data: () => ({
    pipelines: []
  }),
 
  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {
    async getPipelinesData() {
      const token = await this.$auth0.getAccessTokenSilently();
      const response = await fetch('/api/pipelines', {
          headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      this.pipelines = data.data
    },
    getPipelineLink: function(id){
      return `/pipelines/${id}`
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
      this.getPipelinesData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
