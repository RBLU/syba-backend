BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.Kennzahl (
  boid varchar(40),
  itsSyriusBatch varchar(40),
  name varchar(40),
  description varchar(255),
  unit varchar(40),
  sqlproc varchar(40)
  )';

  INSERT INTO SYBA.Kennzahl VALUES ('MLaufzeit', NULL, 'Laufzeit',
                                    'Ausführungsdauer eines Batches in sekunden', 's', 'KZLaufzeit' );

  INSERT INTO SYBA.Kennzahl VALUES ('MWorkItmes', NULL, 'Workitems',
                                    'Anzahl Workitems eines Batches ', NULL,'KZWorkitems' );

  INSERT INTO SYBA.Kennzahl VALUES ('MErrors', NULL, 'Fehler',
                                    'Anzahl Batchlog Einträge vom Typ Fehler', NULL,'KZErrors' );

  INSERT INTO SYBA.Kennzahl VALUES ('MWarnings', NULL, 'Warnungen',
                                    'Anzahl Batchlog Einträge vom Typ Warning', NULL,'KZWarnings' );

  INSERT INTO SYBA.Kennzahl VALUES ('MAuslenkungen', '-5', 'Warnungen',
                                    'Anzahl Batchlog Einträge vom Typ Warning', NULL,'KZWarnings' );

END;