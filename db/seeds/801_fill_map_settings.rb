# rake db:seed:801_fill_map_settings

C80Map::Setting.delete_all
C80Map::Setting.create({
                           map_image:nil
                       })