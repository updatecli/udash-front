<template>
  <v-container>
    <v-row>
      <v-col
        class="text-right"
        cols="auto"
        lg="8"
        md="8"
        sm="12"
      >
        <h1>
          Report
        </h1>
        <h2>
          {{ pipeline.Pipeline.Name }}
        </h2>
      </v-col>
      <v-col
        class="text-center"
      >
        <v-btn
          :icon="getStatusIcon(pipeline.Pipeline.Result)"
          :color="getStatusColor(pipeline.Pipeline.Result)"
          size="100"
        ></v-btn>
      </v-col>
    </v-row>
  </v-container>
  <v-container
  >
    <v-row>
      <v-col
        cols="auto"
        lg="8"
        md="8"
        sm="12"
      >
        <!-- Show Sources -->
        <v-card
          variant="outlined"
          v-if="pipeline.Pipeline.Sources"
        >
          <v-card-title><h4>Source</h4></v-card-title>
          <v-card-text>
              <v-card
                variant="flat"
                v-for="(value, key) in pipeline.Pipeline.Sources" :key="key"
              >
                <v-card-title>
                  <v-icon icon="mdi-circle" :color="getStatusColor(value.Result)"></v-icon>  {{ value.Name }}</v-card-title>
                <v-card-text>{{ value.Description }}</v-card-text>
                <v-chip-group>
                  <v-spacer></v-spacer>
                  <v-chip>
                    <p>{{ key }}</p>
                  </v-chip>
                  <v-chip
                    v-if="value.Information"
                  >
                    <p>{{ value.Information }}</p>
                  </v-chip>
                </v-chip-group>
              </v-card>
          </v-card-text>
        </v-card>

        <v-divider
          :color="getStatusColor(pipeline.Pipeline.Result)"
          thickness="30"></v-divider>

        <!-- Show Conditions -->
        <v-card
          variant="outlined"
          v-if="pipeline.Pipeline.Conditions"
        >
          <v-card-title><h4>Condition</h4></v-card-title>
          <v-card-text>
              <v-card
                variant="flat"
                v-for="(value, key) in pipeline.Pipeline.Conditions" :key="key"
              >
                <v-card-title>
                  <v-icon icon="mdi-circle" :color="getStatusColor(value.Result)"></v-icon>  {{ value.Name }}</v-card-title>
                <v-card-text>{{ value.Description }}</v-card-text>
                <v-chip-group>
                  <v-spacer></v-spacer>
                  <v-chip>
                    <p>{{ key }}</p>
                  </v-chip>
                </v-chip-group>
              </v-card>
          </v-card-text>
        </v-card>

        <v-divider
          :color="getStatusColor(pipeline.Pipeline.Result)"
          thickness="30"></v-divider>

        <!-- Show Targets -->
        <v-card
          variant="outlined"
          v-if="pipeline.Pipeline.Targets"
        >
          <v-card-title><h4>Target</h4></v-card-title>
          <v-card-text>
              <v-card
                variant="flat"
                v-for="(value, key) in pipeline.Pipeline.Targets" :key="key"
              >
                <v-card-title>
                  <v-icon icon="mdi-circle" :color="getStatusColor(value.Result)"></v-icon>  {{ value.Name }}</v-card-title>
                <v-card-text>{{ value.Description }}</v-card-text>
                <v-chip-group>
                  <v-spacer></v-spacer>
                  <v-chip
                    v-if="value.Information"
                  >
                    <p>{{ value.Information }}</p>
                  </v-chip>
                  <v-chip>
                    <p>{{ key }}</p>
                  </v-chip>
                  <v-chip>
                    {{ value.NewInformation }}
                  </v-chip>
                </v-chip-group>
              </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: 'PipelineReportView',

  data: () => ({
    pipeline: {
      "Pipeline": {}
    },
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {

    getPipelineReportLink: function(id){
      return "/pipeline/reports/" + id
    },
    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
    getStatusColor: function(input){
      switch (input) {
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
    async getPipelineReportData() {
      const token = await this.$auth0.getAccessTokenSilently();
      const response = await fetch('/api/pipeline/reports/' + this.$route.params.id, {
          headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      console.log(data.data)

      this.pipeline = data.data;
    },
  },

  async created() {
    try {
      this.getPipelineReportData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
