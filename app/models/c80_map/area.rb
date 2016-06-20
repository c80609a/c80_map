module C80Map
  class Area < ActiveRecord::Base
    belongs_to :building
  end
end