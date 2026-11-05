export interface StructuredLedgerEntry {
  id: string;
  contractorId: string;
  sequenceNumber: number;
  eventType:
    | 'lead_captured'
    | 'crm_transition'
    | 'recommendation_proposed'
    | 'recommendation_approved'
    | 'recommendation_executed'
    | 'conversion_outbox'
    | 'revenue_recognized'
    | 'security_event'
    | 'pipeline_mutation'
    | 'evidence_gathered'
    | 'stage_transition'
    | 'phase2_verification_audit'
    | 'competitor_audit_completed'
    | 'lead_harvested'
    | 'territory_harvest_completed'
    | 'phase3_verification_audit'
    | 'phase3_sequence_triggered'
    | 'phase3_sequence_previewed'
    | 'phase3_outbox_processed'
    | 'phase3_outbox_inspected'
    | 'phase3_live_dispatch'
    | 'phase3_scheduler_executed'
    | 'phase3_scheduler_configuration_checked'
    | 'phase4_verification_audit'
    | 'phase4_consensus_synthesized'
    | 'phase4_weights_recalibrated'
    | 'phase4_arbitrage_executed'
    | 'phase5_verification_audit'
    | 'phase5_runtime_diagnostic'
    | 'phase5_brain_synced'
    | 'phase5_regions_federated'
    | 'phase5_ontology_propagated'
    | 'genesis_block';
  entityType: string;
  entityId: string;
  actor: string;
  payloadHash: string;
  prevHash: string;
  entryHash: string;
  details?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
