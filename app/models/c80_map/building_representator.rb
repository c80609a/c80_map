module C80Map

  module BuildingRepresentator

    extend ActiveSupport::Concern

    #  ERROR: Cannot define multiple 'included' blocks for a Concern
    # included do
    #
    # end

    def self.included(klass)
      klass.extend ClassMethods
      klass.send(:include, InstanceMethods)
    end

    module ClassMethods

      def acts_as_map_building_representator
        class_eval do

          has_many :map_buildings, :as => :building_representator, :class_name => 'C80Map::Building', :dependent => :destroy
          after_save :update_json

          def self.unlinked_buildings
            res = []
            self.all.each do |building|
              # if building.map_buildings.count == 0
                res << building
              # end
            end
            res
          end

          def update_json
            MapJson.update_json
          end

        end
      end
    end

    module InstanceMethods

      def to_hash

        Rails.logger.debug "<BuildingRepresentator.to_hash> self.free_square = #{self.free_square}"

        res = {
            id: self.id,
            title: self.title,
            props: {
                square: self.square,
                free_square: self.free_square,
                floor_height: self.floor_height,
                gate_type: self.gate_type,
                desc: self.desc,
                column_step: self.column_step,
                communications: self.communications,
                price: self.price_string
            }
        }
        res
      end

    end

  end
end

ActiveRecord::Base.send :include, C80Map::BuildingRepresentator