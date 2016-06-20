module C80Map
  class MapAjaxController < ApplicationController

    def save_map_data
      # puts "<MapAjaxController.save_map_data> #{params}"
      #
      # {"areas"=>{
      #   "1"=>{ # parent building id
      #     "0"=>{
      #           "coords"=> [ "1877.5691809823902", ... ]
      #     }
      #   }
      # },
      # ...}

      if params[:buildings].present?
        params[:buildings].each do |new_building_options|
          b = Building.create({ coords: new_building_options[:coords] })
        end
      end

      if params[:areas].present?
        params[:areas].each_with_key do |new_area_options,key|
          #
          # if b.present?
          #
          # end
        end
      end

      respond_to do |format|
        format.json { render json: params }
      end
    end

  end
end