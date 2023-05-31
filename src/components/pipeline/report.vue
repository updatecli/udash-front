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
      </v-col>
      <v-col
        class="text-left"
      >
        <h1>
          {{ pipeline.Pipeline.Name }}
        </h1>
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
      <v-col
        class="text-left"
        cols="auto"
        lg="4"
        md="4"
        sm="12"
      >
        <v-card
          variant="outlined"
        >
          <v-card-title>
            Metadata
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col>State</v-col><v-col><v-icon icon="mdi-circle" :color="getStatusColor(latestReportByName.Pipeline.Result)"></v-icon></v-col>
            </v-row>
            <v-row>
              <v-col>Created At</v-col><v-col>{{ pipeline.Created_at }}</v-col>
            </v-row>
            <v-row>
              <v-col>Updated At</v-col><v-col>{{ pipeline.Updated_at }}</v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-divider
          :color="getStatusColor(pipeline.Pipeline.Result)"
          v-show="!isLatestReport()"
          thickness="30"></v-divider>
        <v-card
          variant="outlined"
          v-show="!isLatestReport()"
        >
          <v-card-title>
            Newer report detected with similar name
          </v-card-title>

          <v-card-text>
            <p>
              Updated at {{  latestReportByName.Updated_at }}
            </p>
              <v-icon icon="mdi-circle" :color="getStatusColor(latestReportByName.Pipeline.Result)"></v-icon>  {{ latestReportByName.Pipeline.Name }}
              <v-btn
                icon="mdi-arrow-right-circle"
                variant="flat"
                :to=getPipelineReportLink(latestReportByName.ID)>
              </v-btn>
          <v-divider></v-divider>
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
    latestReportByName: {
      "Pipeline": {}
    },
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  methods: {

    isLatestReport(){
      return this.latestReportByName.ID == this.pipeline.ID
    },

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

      this.pipeline = data.data;
      this.latestReportByName = data.latestReportByName
      this.isLatestReport()
    },
  },

  async created() {
    /*
      One thing to note when using routes with params is that
      when the user navigates from /users/johnny to /users/jolyne,
      the same component instance will be reused.
      Since both routes render the same component,
      this is more efficient than destroying the old instance and then creating a new one. However, this also means that the lifecycle hooks of the component will not be called.
    */
    this.$watch(
      () => this.$route.params,
      (toParams, previousParams) => {
        if (toParams.id != previousParams.id) {
          try {
            this.getPipelineReportData()
          } catch (error) {
            console.log(error);
          }
        }
      }
    )
    try {
      this.getPipelineReportData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>
