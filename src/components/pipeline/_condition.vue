<template>
    <v-toolbar
        density="compact"
        class="text-white"
    >
        <v-toolbar-title>
            <v-icon icon="mdi-circle" :color="getStatusColor(data.Result)"></v-icon>  {{ data.Name }}
        </v-toolbar-title>

        <v-toolbar-items>
            <v-btn>{{ id }}</v-btn>
        </v-toolbar-items>
    </v-toolbar>

    <v-container fluid>
        <v-card
            variant="flat"
        >
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
        </v-card>
   </v-container>
   <v-expansion-panels>
       <v-expansion-panel
           v-if="data.ConsoleOutput"
           title="Console"
           :text="data.ConsoleOutput"
           class="text-body-1"
           tag="pre"
       ></v-expansion-panel>
   </v-expansion-panels>
</template>

<script>
    export default {
        name: "ConditionComponent",

        data: () => ({
        }),

        props: [
            'data',
            'id'
        ],

        methods: {
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
            }
        }
    }
</script>