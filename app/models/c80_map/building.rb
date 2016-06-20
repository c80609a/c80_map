module C80Map
  class Building < ActiveRecord::Base
    has_many :areas, :class_name => 'C80Map::Area', :dependent => :destroy
  end
end