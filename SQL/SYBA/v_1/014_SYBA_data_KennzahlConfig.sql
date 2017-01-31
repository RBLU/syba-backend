BEGIN
  INSERT into syba.KennzahlConfig values (
    'MLaufzeitConfigPoliceEV', 'MPolEvDrucken', '-500231', 'MLaufzeit',
    'Laufzeit', 'Misst die Laufzeit des Batchlaufes in s', 1, 0, 0, 0, 900, 1500, NULL

  );
END;


/*
    boid varchar(40),
  itsBatchConfig varchar(40),
  itsBatch varchar(40),
  itsKennzahl varchar(40),
  name varchar(100),
  description varchar(100),
  active number(1),
  levelMin number(10,2),
  levelLowError number(10,2),
  levelLowWarning number(10,2),
  levelNormal number(10,2),
  levelHighWarning number(10,2),
  levelMax number(10,2)
*/