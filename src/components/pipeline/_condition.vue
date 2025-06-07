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

            <v-card-text>{{ data.Description }}</v-card-text>
        </v-card>
   </v-container>

   <ConsoleOutputComponent
     v-if="data.ConsoleOutput"
     :data="data.ConsoleOutput"
   ></ConsoleOutputComponent>

</template>

<script>
    import ConsoleOutputComponent from './_consoleOutput.vue'

    import { getStatusColor, getStatusIcon } from '@/composables/status';

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
              return getStatusColor(input);
            },
            getStatusIcon: function(input){
              return getStatusIcon(input);
            }
        }
    }
</script>
