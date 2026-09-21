<template>
    <div class="stage-header">
        <v-icon class="stage-header__icon" :icon="getStatusIcon(data.Result)" :color="getStatusColor(data.Result)" aria-hidden="true"></v-icon>
        <h2 class="stage-header__name text-title-large">{{ data.Name }}</h2>
        <span class="resource-id text-body-medium text-medium-emphasis">{{ id }}</span>
    </div>

    <v-container fluid class="px-0 px-sm-4">
        <v-row class="mb-4">
            <v-col cols="12">
                <v-card flat class="pa-3">
                    <dl class="meta-grid">
                    <div>
                        <dt>Status</dt>
                        <dd>
                            <v-chip
                                :color="getStatusColor(data.Result)"
                                size="small"
                                variant="flat"
                            >
                                <v-icon size="x-small" class="mr-1">
                                    {{ getStatusIcon(data.Result) }}
                                </v-icon>
                                {{ getStatusText(data.Result) }}
                            </v-chip>
                        </dd>
                    </div>
                    <div>
                        <dt>Kind</dt>
                        <dd>
                            <v-chip variant="outlined" size="small">
                                {{ data.Config?.Kind || 'N/A' }}
                            </v-chip>
                        </dd>
                    </div>
                    <div>
                        <dt>Information</dt>
                        <dd>
                            <span v-if="data.Information" class="text-truncate">
                                {{ sanitizedInformation }}
                            </span>
                            <span v-else>No information</span>
                        </dd>
                    </div>
                    </dl>
                </v-card>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" lg="8" md="8" sm="12">
                <v-card v-if="data.Scm?.URL" variant="flat" class="mb-4">
                    <v-card-title class="d-flex align-center pb-2">
                        <v-icon class="mr-2">mdi-git</v-icon>
                        Source control
                    </v-card-title>
                    <v-card-text class="pt-0">
                        <v-row>
                            <v-col cols="12" md="8">
                                <div class="d-flex align-center">
                                    <v-icon size="small" class="mr-2 text-medium-emphasis" aria-hidden="true">mdi-link</v-icon>
                                    <span class="text-body-medium text-break">{{ data.Scm.URL }}</span>
                                </div>
                            </v-col>
                            <v-col cols="12" md="4">
                                <div class="d-flex align-center">
                                    <v-icon size="small" class="mr-2 text-medium-emphasis" aria-hidden="true">mdi-source-branch</v-icon>
                                    <span class="text-body-medium">{{ data.Scm.Branch?.Source || 'Unknown branch' }}</span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <v-card variant="flat">
                    <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-text</v-icon>
                        Description
                    </v-card-title>
                    <v-card-text>
                        <ResourceDescription :text="data.Description" />
                    </v-card-text>

                    <v-card-actions v-if="data.Information">
                        <v-expansion-panels variant="accordion" class="w-100" elevation="0">
                            <v-expansion-panel>
                                <v-expansion-panel-title>
                                    <v-icon class="mr-2" size="small">mdi-information-outline</v-icon>
                                    Additional information
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
                <v-card flat class="config-card">
                    <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">mdi-cog</v-icon>
                        Configuration
                    </v-card-title>

                    <v-card-text>
                        <div v-if="data.Config?.Spec" class="mb-4">
                            <div class="d-flex align-center mb-2">
                                <h3 class="text-label-large font-weight-medium">Specification</h3>
                            </div>
                            <v-card variant="outlined" class="pa-2">
                                <div class="yaml-container">
                                    <pre><code v-highlight class="language-yaml">{{ toYAML(data.Config.Spec) }}</code></pre>
                                </div>
                            </v-card>
                        </div>

                        <div v-if="data.Config?.Transformers" class="mb-4">
                            <div class="d-flex align-center mb-2">
                                <h3 class="text-label-large font-weight-medium">Transformers</h3>
                            </div>
                            <v-card variant="outlined" class="pa-2">
                                <div class="yaml-container">
                                    <pre><code v-highlight class="language-yaml">{{ toYAML(data.Config.Transformers) }}</code></pre>
                                </div>
                            </v-card>
                        </div>

                        <div v-if="!data.Config?.Spec && !data.Config?.Transformers" class="text-center pa-4">
                            <v-icon size="large" class="text-medium-emphasis" aria-hidden="true">mdi-file-outline</v-icon>
                            <p class="text-medium-emphasis mt-2">No configuration available</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row
            v-if="data.ConsoleOutput"
        >
            <v-col cols="12">
                <ConsoleOutputComponent
                    :data="data.ConsoleOutput"
                ></ConsoleOutputComponent>
            </v-col>
        </v-row>
        <v-row
            v-if="data.Changelogs"
        >
            <v-col cols="12">
                <ChangelogComponent
                    :data="data.Changelogs"
                ></ChangelogComponent>
            </v-col>
        </v-row>
    </v-container>

</template>

<script>
import ConsoleOutputComponent from './_consoleOutput.vue'
import ResourceDescription from './ResourceDescription.vue'
import ChangelogComponent from './_changelog.vue'

import { getStatusColor, getStatusIcon, getStatusText } from '@/composables/status';
import { toYAML } from '@/composables/yaml'

export default {
    name: "SourceComponent",

    components: {
        ConsoleOutputComponent,
        ResourceDescription,
        ChangelogComponent,
    },

    computed: {
        sanitizedInformation: function(){
            // Arbitrary limit of 72 characters
            if (this.data.Information && this.data.Information.length > 72 ) {
                return this.data.Information.substring(0, 69 ) + "..."
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
        getStatusColor,
        getStatusIcon,
    }
}
</script>

<style scoped>
.stage-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 12px 16px;
    background: rgb(var(--v-theme-surface));
}

.stage-header__name {
    flex: 1 1 16rem;
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
}

.resource-id {
    font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
    overflow-wrap: anywhere;
}

.information-cell {
    max-width: 200px;
}

.yaml-container {
    max-height: 300px;
    overflow-y: auto;
    border-radius: 4px;
}

.yaml-container pre {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
}

.config-card {
    position: sticky;
    top: 20px;
}

.information-content {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace;
    background-color: rgba(var(--v-theme-on-surface), 0.05);
    color: rgb(var(--v-theme-on-surface));
    padding: 12px;
    border-radius: 4px;
    font-size: 0.9rem;
}
</style>
