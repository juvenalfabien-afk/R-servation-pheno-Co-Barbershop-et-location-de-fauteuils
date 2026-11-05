# Rollback migration 006

À exécuter uniquement pendant une fenêtre de maintenance, après arrêt du cron de notifications et sauvegarde vérifiée.

```sql
begin;
drop trigger if exists rdv_notification_outbox on public.rdv_bookings;
drop trigger if exists location_notification_outbox on public.reservations;
drop function if exists public.enqueue_rdv_notification_job();
drop function if exists public.enqueue_location_notification_job();
drop function if exists public.claim_notification_jobs(integer, integer);
drop function if exists public.finalize_notification_job(text, text, text, boolean, integer, text);
drop table if exists public.notification_jobs;
commit;
```

Ce rollback supprime les jobs encore en attente. Exporter la table avant retrait si des notifications doivent être reprises.
