ALTER TABLE events
ALTER COLUMN id TYPE varchar(8);

ALTER TABLE participants
ALTER COLUMN id TYPE varchar(8);

ALTER TABLE responses
ALTER COLUMN event_id TYPE varchar(8);

ALTER TABLE responses
ALTER COLUMN participant_id TYPE varchar(8);

ALTER TABLE admins
ALTER COLUMN username TYPE varchar(16);

ALTER TABLE events 
ADD COLUMN logoURL text;