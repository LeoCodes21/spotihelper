declare module "process-exists" {
  function check(proc: string | number) : Promise<boolean>;

  export = check;
}