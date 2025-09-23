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
        <v-row class="mb-4">
            <v-col cols="12">
                <v-card flat class="pa-3">
                    <v-table class="metadata-table">
                        <thead>
                            <tr class="bg-grey-lighten-4">
                                <th class="font-weight-bold" style="width: 25%;">ID</th>
                                <th class="font-weight-bold" style="width: 25%;">Status</th>
                                <th class="font-weight-bold" style="width: 75%;">Kind</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="font-weight-medium">{{ id }}</td>
                                <td>
                                    <v-chip
                                        :color="getStatusColor(data.Result)"
                                        size="small"
                                        variant="flat"
                                        class="text-white"
                                    >
                                        <v-icon size="x-small" class="mr-1">
                                            {{ getStatusIcon(data.Result) }}
                                        </v-icon>
                                        {{ getStatusText(data.Result) }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-chip variant="outlined" size="small">
                                        {{ data.Config?.Kind || 'N/A' }}
                                    </v-chip>
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" lg="8" md="8" sm="12">
                <v-card v-if="data.Scm.URL" variant="flat" class="mb-4">
                    <v-card-title class="d-flex align-items-center pb-2">
                        <v-icon class="mr-2">mdi-git</v-icon>
                        Source Control
                    </v-card-title>
                    <v-card-text class="pt-0">
                        <v-row>
                            <v-col cols="12" md="8">
                                <div class="d-flex align-items-center">
                                    <v-icon size="small" class="mr-2" color="grey-darken-1">mdi-link</v-icon>
                                    <span class="text-body-2">{{ data.Scm.URL }}</span>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="d-flex align-items-center">
                                    <v-icon size="small" class="mr-2" color="grey-darken-1">mdi-source-branch</v-icon>
                                    <span class="text-body-2">{{ data.Scm.Branch.Source }}</span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <v-card variant="flat">
                    <v-card-title class="d-flex align-items-center">
                        <v-icon class="mr-2">mdi-text</v-icon>
                        Description
                    </v-card-title>
                    <v-card-text>
                        <p class="text-body-1">{{ data.Description || 'No description available' }}</p>
                    </v-card-text>

                    <v-card-actions v-if="data.Information">
                        <v-expansion-panels variant="accordion" elevation="0" class="w-100">
                            <v-expansion-panel>
                                <v-expansion-panel-title>
                                    <div class="d-flex align-items-center">
                                        <v-icon class="mr-2" size="small">mdi-information-outline</v-icon>
                                        Additional Information
                                        <v-chip size="x-small" variant="outlined" class="ml-2">
                                            {{ Math.ceil(data.Information.length / 100) * 100 }} chars
                                        </v-chip>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <div class="information-content">
                                        {{ data.Information }}
                                    </div>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" lg="4" md="4" sm="12">
                <v-card flat>
                    <v-card-title class="d-flex align-items-center">
                        <v-icon class="mr-2">mdi-cog</v-icon>
                        Configuration
                    </v-card-title>

                    <v-card-text>
                        <div v-if="data.Config?.Spec" class="mb-4">
                            <div class="d-flex align-items-center mb-2">
                                <v-icon size="small" class="mr-2">mdi-file-code</v-icon>
                                <h5 class="text-subtitle-2 font-weight-medium">Specification</h5>
                            </div>
                            <v-card variant="outlined" class="pa-2">
                                <div class="yaml-container">
                                    <pre><code v-highlight class="language-yaml">{{ toYAML(data.Config.Spec) }}</code></pre>
                                </div>
                            </v-card>
                        </div>

                        <div v-if="data.Config?.Transformers" class="mb-4">
                            <div class="d-flex align-items-center mb-2">
                                <v-icon size="small" class="mr-2">mdi-transform</v-icon>
                                <h5 class="text-subtitle-2 font-weight-medium">Transformers</h5>
                            </div>
                            <v-card variant="outlined" class="pa-2">
                                <div class="yaml-container">
                                    <pre><code v-highlight class="language-yaml">{{ toYAML(data.Config.Transformers) }}</code></pre>
                                </div>
                            </v-card>
                        </div>

                        <div v-if="!data.Config?.Spec && !data.Config?.Transformers" class="text-center pa-4">
                            <v-icon size="large" color="grey-lighten-1">mdi-file-outline</v-icon>
                            <p class="text-grey-darken-1 mt-2">No configuration available</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>

    <ConsoleOutputComponent
        v-if="data.ConsoleOutput"
        :data="data.ConsoleOutput"
    ></ConsoleOutputComponent>
</template>

<script>
import ConsoleOutputComponent from './_consoleOutput.vue'

import { getStatusColor, getStatusIcon, getStatusText } from '@/composables/status';
import { toYAML } from '@/composables/yaml'

export default {
    name: "ConditionComponent",

    components: {
        ConsoleOutputComponent,
    },

    computed: {
        sanitizedInformation: function(){
            // 72 character limit as requested
            if (this.data.Information && this.data.Information.length > 72) {
                return this.data.Information.substring(0, 69) + "..."
            }
            return this.data.Information || ''
        },
    },

    data: () => ({
    }),

    props: [
        'data',
        'id'
    ],

    methods: {
        toYAML,
        getStatusText,
        getStatusColor: function(input){
            return getStatusColor(input);
        },
        getStatusIcon: function(input){
            return getStatusIcon(input);
        }
    }
}
</script>

<style scoped>

.metadata-table {
    font-size: 1rem;
}

.metadata-table th {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 12px 16px;
    background-color: rgba(0, 0, 0, 0.02);
}

.metadata-table td {
    font-size: 1rem;
    padding: 12px 16px;
    font-weight: 500;
}

.yaml-container {
    max-height: 300px;
    overflow-y: auto;
    background-color: #f5f5f5;
    border-radius: 4px;
}

.yaml-container pre {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
}

.information-content {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Roboto Mono', monospace;
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    font-size: 0.9rem;
}
</style>
