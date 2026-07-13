
# IFA規劃儀表板

<div v-if="isInitialized">
  <ClientDashboard v-if="isLoggedIn" />
  <AgentManual v-else />
</div>
<div v-else v-loading="true" style="min-height: 300px; width: 100%"></div>

<script setup>
import { computed } from 'vue'
import { useAgentStore } from '@/stores/agent'
import AgentManual from '@/components/domain/agent/AgentManual.vue'
import ClientDashboard from '@/components/domain/client/ClientDashboard.vue'

const agentStore = useAgentStore()
const isLoggedIn = computed(() => agentStore.isLoggedIn)
const isInitialized = computed(() => agentStore.isInitialized)
</script>