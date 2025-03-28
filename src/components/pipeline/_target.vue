<template>
   <v-toolbar
    density="compact"
    class="text-white"
   >
    <v-toolbar-title>
      <v-icon icon="mdi-circle" :color="getStatusColor(data.Result)"></v-icon>  {{ data.Name }}
    </v-toolbar-title>

    <v-toolbar-items>
      <v-btn 
        v-if="data.DryRun == true"
      >
        DryRun
      </v-btn>
      <v-btn
      >
        {{ id }}
      </v-btn>
            
    </v-toolbar-items>
   </v-toolbar>

  <v-container fluid>
    <v-card variant="flat">

      <v-card-subtitle v-if="data.Scm.URL">
        <v-row>
          <v-col
            class="text-left"
          >
            <v-icon icon="mdi-git"></v-icon>
          </v-col>
          <v-col
            class="text-center"
          >
            {{ data.Scm.URL }}
          </v-col>
          <v-col
            class="text-right"
          >
            {{ data.Scm.Branch.Source }}
          </v-col>
        </v-row>
        <v-divider></v-divider>
      </v-card-subtitle>

      <v-card-text>
          {{ data.Description }}
      </v-card-text>

      <v-card-actions
        v-if="isInformationUpdated()"
      >
          <v-spacer></v-spacer>
          <v-btn
            v-if="data.Information"
            variant="outlined"
          >
            <p>{{ sanitizedInformation }}</p>
          </v-btn>

          <v-btn
            icon="mdi-arrow-right"
            v-if="data.NewInformation"
          ></v-btn>

          <v-btn
            variant="outlined"
            v-if="data.NewInformation"
          >
            {{ sanitizedNewInformation }}
          </v-btn>
          <v-spacer></v-spacer>
      </v-card-actions>
      <v-card-actions
        v-else
      >
          <v-spacer></v-spacer>
          <v-btn
            v-if="data.NewInformation"
            variant="outlined"
          >
            <p>{{ sanitizedNewInformation }}</p>
          </v-btn>
          <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-container>

  <ChangelogComponent
    v-if="data.Changelogs"
    :data="data.Changelogs"
  ></ChangelogComponent>

  <ConsoleOutputComponent
    v-if="data.ConsoleOutput"
    :data="data.ConsoleOutput"
  ></ConsoleOutputComponent>

</template>

<script>

  import ConsoleOutputComponent from './_consoleOutput.vue'
  import ChangelogComponent from './_changelog.vue'

    export default {
        name: "TargetComponent",

        components: {
          ConsoleOutputComponent,
          ChangelogComponent,
        },

        computed: {
          sanitizedInformation: function(){
              if (this.data.Information.length > 72) {
                return this.data.Information.substring(0, 69) + "..."
              }

              return this.data.Information
          },
          sanitizedNewInformation: function(){
              if (this.data.NewInformation.length > 72) {
                return this.data.NewInformation.substring(0, 69) + "..."
              }

              return this.data.NewInformation
          },
        },

        data: () => ({
        }),

        props: [
            'data',
            'id'
        ],

        methods: {
            isInformationUpdated: function(){
                if (this.data.Information == "unknown") {
                  return false
                }

                return this.data.Information !== this.data.NewInformation
            },
            getStatusColor: function(input){
                switch (input) {
                  case "✔":
                    return "success"
                  case "✗":
                    return "red"
                  case "⚠":
                    return "orange"
                  case "-":
                    return "grey"
                  default:
                    return "yellow"
                }
            }
        }
    }
</script>

