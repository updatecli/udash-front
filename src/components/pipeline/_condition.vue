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

   <ConsoleOutputComponent
     v-if="data.ConsoleOutput"
     :data="data.ConsoleOutput"
   ></ConsoleOutputComponent>

</template>

<script>
    import ConsoleOutputComponent from './_consoleOutput.vue'

    export default {
        name: "ConditionComponent",

        components: {
            ConsoleOutputComponent,
        },

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
                    return "green"
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
