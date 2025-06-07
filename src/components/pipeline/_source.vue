<template>
    <v-toolbar
        density="compact"
        class="text-white"
    >
        <v-toolbar-title>
            <v-icon
                :icon="getStatusIcon(data.Result)"
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
                    <p>{{ sanitizedInformation }}</p>
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

    import { getStatusColor, getStatusIcon } from '@/composables/status';

    export default {
        name: "SourceComponent",

        components: {
            ConsoleOutputComponent,
            ChangelogComponent,
        },

        computed: {
            sanitizedInformation: function(){
                // Arbitrary limit of 72 characters
                if (this.data.Information.length > 72 ) {
                    return this.data.Information.substring(0, 69 ) + "..."
                }

              return this.data.Information
            },
        },

        data: () => ({
        }),

        props: [
            'data',
            'id'
        ],

        methods: {
            getStatusColor: function(input){
                return getStatusColor(input);
            },
            getStatusIcon: function(input){
                return getStatusIcon(input);
            }
        }
    }
</script>
