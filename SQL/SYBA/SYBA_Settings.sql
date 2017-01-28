BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.SETTINGS (
  installedDate date,
  schemaVersion varchar(40)
  )';
  EXECUTE IMMEDIATE 'INSERT into SYBA.SETTINGS VALUES (SYSDATE, ''1'')';
  commit;
END;