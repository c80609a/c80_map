module C80Map
  class MapAjaxController < ApplicationController

    def save_map_data
      puts "<MapAjaxController.save_map_data> #{params[:buildings]}"

      #{ "buildings"=>{"0"=>{"coords"=>["2496.5894495412845",...]}} }
      #{ "areas"=>{"0"=>{"coords"=>["2496.5894495412845",...]}} }

      result = {
          areas: [],
          buildings: [],
          updated_locations_json: nil
      }

      if params[:buildings].present?
        params[:buildings].each_key do |key|
          new_building_options = params[:buildings][key]
          puts "<MapAjaxController.save_map_data> new_building_options = #{new_building_options}"
          puts "<MapAjaxController.save_map_data> new_building_options[:coords] = #{new_building_options[:coords]}"
          b = Building.new({ coords: new_building_options[:coords].join(',') })

          # в случае успеха - вернём id созданного здания,
          # тогда js обновит id и перенесёт здание из массива "новые здания" (drawn_buildings).
          # в случае неудачи - вернём описание ошибки
          # завершаем всё обновленным locations.json, который Map возьмёт
          # и положит в data

          if b.valid?
            b.save
            result[:buildings] << { id: b.id }
          else
            result[:buildings] << { id: new_building_options.id, status: 'error' }
          end
        end
      end

      # if params[:areas].present?
      #   params[:areas].each_with_key do |new_area_options,key|
          #
          # if b.present?
          #
          # end
        # end
      # end
      puts "<MapAjaxController.save_map_data> result = #{result.to_json}"

      respond_to do |format|
        format.json { render json: params }
      end
    end

  end
end