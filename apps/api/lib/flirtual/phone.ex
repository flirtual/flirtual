defmodule Flirtual.Phone do
  @sms_types [:mobile, :fixed_line_or_mobile]

  def parse(input) when is_binary(input) do
    with {:ok, number} <- ExPhoneNumber.parse(input, nil),
         true <- ExPhoneNumber.is_valid_number?(number) do
      if ExPhoneNumber.get_number_type(number) in @sms_types,
        do: {:ok, ExPhoneNumber.format(number, :e164)},
        else: {:error, :phone_not_mobile}
    else
      _ -> {:error, :phone_invalid}
    end
  end

  def parse(_), do: {:error, :phone_invalid}
end
