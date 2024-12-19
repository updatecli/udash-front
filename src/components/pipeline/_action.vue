<template>

    <v-toolbar
        density="compact"
        class="text-white"
    >
        <v-toolbar-title
            :ref="data.actionUrl"
        >
            <v-icon
                icon="mdi-source-branch"
            ></v-icon>  {{ data.title }}
        </v-toolbar-title>

        <v-toolbar-items>
            <v-btn
                :href="data.actionUrl"
            >Review</v-btn>
        </v-toolbar-items>

    </v-toolbar>
</template>

<script>
    export default {
        name: "ActionComponent",

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
                  case "-":
                    return "grey"
                  default:
                    return "yellow"
                }
            }
        }
    }
</script>
