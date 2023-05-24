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
          Pipeline
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
          elevation="0"
          v-if="pipeline.Pipeline.Sources"
        >
          <v-card-title><h4>Sources</h4></v-card-title>
          <v-card-text>
            <v-timeline
            >
              <v-timeline-item
                v-for="(value, key) in pipeline.Pipeline.Sources" :key="key"
                :dot-color="getStatusColor(value.Result)"
                large
              >
                <template v-slot:opposite>
                  <div width="100">
                    {{  key }}
                  </div>
                </template>
                <v-card
                  rounded="0"
                  variant="outlined"
                >
                  <v-card-title>{{ value.Name }}</v-card-title>
                  <v-card-text>{{ value.Description }}</v-card-text>
                  <v-chip-group>
                    <v-chip
                      v-if="value.Information"
                    >
                      <p>{{ value.Information }}</p>
                    </v-chip>
                    <v-chip>
                      <p>{{ value.Result }}</p>
                    </v-chip>
                    <v-chip>
                      <p>id: {{ key }}</p>
                    </v-chip>
                  </v-chip-group>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <!-- Show Conditions -->
        <v-card
          elevation="0"
          v-if="pipeline.Pipeline.Conditions"
        >
          <v-card-title><h4>Conditions</h4></v-card-title>
          <v-card-text>
            <v-timeline>
              <v-timeline-item
                v-for="(value, key) in pipeline.Pipeline.Conditions" :key="key"
                :dot-color="getStatusColor(value.Result)"
              >
                <v-card
                  rounded="0"
                  variant="outlined"
                >
                  <v-card-title>{{ value.Name }}</v-card-title>
                  <v-card-text>{{ value.Description }}</v-card-text>

                  <v-chip-group>
                    <v-chip
                      v-if="value.Information"
                    >
                      <p>{{ value.Information }}</p>
                    </v-chip>
                    <v-chip>
                      <p>{{ value.Result }}</p>
                    </v-chip>
                    <v-chip>
                      <p>id: {{ key }}</p>
                    </v-chip>
                  </v-chip-group>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>

        <!-- Show Targets -->
        <v-card
          elevation="0"
          v-if="pipeline.Pipeline.Targets"
        >
          <v-card-title><h4>Targets</h4></v-card-title>
          <v-card-text>
            <v-timeline
            >
              <v-timeline-item
                v-for="(value, key) in pipeline.Pipeline.Targets" :key="key"
                :dot-color="getStatusColor(value.Result)"
                large
              >
                <template v-slot:opposite>
                  <div width="100">
                    {{  key }}
                  </div>
                </template>
                <v-card
                  rounded="0"
                  variant="outlined"
                >
                  <v-card-title>{{ value.Name }}</v-card-title>
                  <v-card-text>{{ value.Description }}</v-card-text>

                  <v-chip-group>
                    <v-chip
                      v-if="value.Information"
                    >
                      <p>{{ value.Information }}</p>
                    </v-chip>
                    <v-chip>
                      <p>{{ value.Result }}</p>
                    </v-chip>
                    <v-chip>
                      <p>id: {{ key }}</p>
                    </v-chip>
                  </v-chip-group>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: 'PipelineDashboard',

  data: () => ({
    pipeline: {
      "Pipeline": {}
    },
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
    async getPipelineData() {
      const token = await this.$auth0.getAccessTokenSilently();
      const response = await fetch('/api/pipelines/' + this.$route.params.id, {
          headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      this.pipeline = data.data;
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
