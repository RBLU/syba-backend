BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.LOCALUSER (
  boid varchar(40),
  Name varchar(40),
  vorname varchar(40),
  username varchar(40),
  hashedpassword varchar(60),
  roles varchar(60),
  email varchar(69),
  CONSTRAINT lu_boid unique(boid))';

  EXECUTE IMMEDIATE 'INSERT INTO SYBA.LOCALUSER VALUES (''sysadmboid'', ''Administrator'', ''System'', ''sysadmin'', ''$2a$08$Eew4NFqelLFDJev6H.Dmme86TuXNd36MTvEP81E7RK6pmvsNdev8.'', ''systemadmin'', ''symona@symona.symona'')';
END;