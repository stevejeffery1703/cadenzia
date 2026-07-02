-- Denormalized track display name on listening_sessions. The track catalog
-- lives only in the frontend bundle (src/utils/tracks.js), not in D1, so the
-- Worker can't resolve track_id -> a friendly name for the "most listened"
-- stat without this — the client already knows the name when it records the
-- session, so it's cheapest to just carry it along.
ALTER TABLE listening_sessions ADD COLUMN track_name TEXT;
