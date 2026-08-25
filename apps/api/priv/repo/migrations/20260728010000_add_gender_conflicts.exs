defmodule Flirtual.Repo.Migrations.AddGenderConflicts do
  use Ecto.Migration

  # Conflicting gender pairs:
  # Man + Woman
  # Man + Cis Woman
  # Man + Trans Woman
  # Woman + Cis Man
  # Woman + Trans Man
  # Cis Man + Cis Woman
  # Cis Man + Trans Man
  # Cis Man + Trans Woman
  # Cis Man + Transgender
  # Cis Man + Transfeminine
  # Cis Man + Transmasculine
  # Cis Woman + Trans Man
  # Cis Woman + Trans Woman
  # Cis Woman + Transgender
  # Cis Woman + Transfeminine
  # Cis Woman + Transmasculine
  # Trans Man + Trans Woman
  def up do
    execute("""
    UPDATE attributes
    SET metadata = coalesce(attributes.metadata, '{}'::jsonb)
                   || jsonb_build_object('conflicts', gender.conflicts)
    FROM (VALUES
        ('706bc4d5-4828-4dd6-bbfd-2f60c92b214f'::uuid, -- Woman
         '["rhw3rcbheU7vc9vcSy6W6V", "GJitRtRoYWT6DfVasptK7N", "XTVsHQMWXiJGEc5xCf7RUb"]'::jsonb),
        ('983215e5-3653-4dd0-901a-71f83e0e72eb'::uuid, -- Man
         '["tpkW7r8PZ2RUuYGUSYi82N", "2ETbJJJ3shADLphvncUwSL", "HWte4cB6TUzzXZoJeuxJuf"]'::jsonb),
        ('67a09f60-5399-4ba5-8f71-01e2e20977ec'::uuid, -- Cis Woman
         '["rhw3rcbheU7vc9vcSy6W6V", "GJitRtRoYWT6DfVasptK7N", "XTVsHQMWXiJGEc5xCf7RUb", "HWte4cB6TUzzXZoJeuxJuf",
           "tyrdBY4Rbfitznr65hpRPR", "rGFyY9WbvBBJSUAUpY5iUE", "CHkgoEoKzTSeVaLVByviBZ"]'::jsonb),
        ('70eeef2b-43c9-45a2-9ce4-dae51603198a'::uuid, -- Cis Man
         '["tpkW7r8PZ2RUuYGUSYi82N", "2ETbJJJ3shADLphvncUwSL", "HWte4cB6TUzzXZoJeuxJuf", "XTVsHQMWXiJGEc5xCf7RUb",
           "tyrdBY4Rbfitznr65hpRPR", "rGFyY9WbvBBJSUAUpY5iUE", "CHkgoEoKzTSeVaLVByviBZ"]'::jsonb),
        ('d503f82b-94c1-46f6-aea7-6792a453f46b'::uuid, -- Trans Woman
         '["rhw3rcbheU7vc9vcSy6W6V", "GJitRtRoYWT6DfVasptK7N", "XTVsHQMWXiJGEc5xCf7RUb", "2ETbJJJ3shADLphvncUwSL"]'::jsonb),
        ('bc1441dc-6781-4655-81ff-f6393accf40e'::uuid, -- Trans Man
         '["tpkW7r8PZ2RUuYGUSYi82N", "2ETbJJJ3shADLphvncUwSL", "HWte4cB6TUzzXZoJeuxJuf", "GJitRtRoYWT6DfVasptK7N"]'::jsonb),
        ('8361f6b1-0574-4210-b81b-68a223190b07'::uuid, -- Transgender
         '["GJitRtRoYWT6DfVasptK7N", "2ETbJJJ3shADLphvncUwSL"]'::jsonb),
        ('461421fc-6b5c-43a0-bbcb-3daea7cfea1b'::uuid, -- Transfeminine
         '["GJitRtRoYWT6DfVasptK7N", "2ETbJJJ3shADLphvncUwSL"]'::jsonb),
        ('af315898-ece5-4d98-aaa2-30b5fc6fb5c9'::uuid, -- Transmasculine
         '["GJitRtRoYWT6DfVasptK7N", "2ETbJJJ3shADLphvncUwSL"]'::jsonb)
      ) AS gender(id, conflicts)
    WHERE attributes.id = gender.id
    """)
  end
end
