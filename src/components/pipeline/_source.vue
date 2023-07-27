<template>
    <v-toolbar
        density="compact"
        class="text-white"
    >
        <v-toolbar-title>
            <v-icon
                icon="mdi-circle"
                :color="getStatusColor(data.Result)"
            ></v-icon>  {{ data.Name }}
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

            <v-card-text
            >
                {{ data.Description }}

            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    v-if="data.Information"
                    variant="outlined"
                >
                    <p>{{ data.Information }}</p>
                </v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-container>
    <v-expansion-panels>
        <v-expansion-panel
            v-if="data.Changelog"
            title="Changelog"
            :text="data.Changelog"
            tag="pre"
            class="text-body-1"
            inset

        ></v-expansion-panel>
    </v-expansion-panels>
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
        name: "SourceComponent",

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
